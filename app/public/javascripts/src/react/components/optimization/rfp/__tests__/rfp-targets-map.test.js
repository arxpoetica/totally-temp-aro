/* global test expect jest */
import React from 'react'
import { shallow } from 'enzyme'
import { RfpTargetsMap } from '../rfp-targets-map'
import Point from '../../../../common/point'

const targets = [
  new Point(47.58444322, -122.330330, 1),
  new Point(47.59, -122.34, 2),
  new Point(47.57, -122.32, 3)
]

// -----------------------------------------------------------------------------
test('With no targets', () => {
  shallow(
    <RfpTargetsMap targets={[]}
      selectedTarget={null}
    />
  )
})

// -----------------------------------------------------------------------------
test('With targets, no selection', () => {
  // First mock all the google maps global object
  const mockSetPosition = jest.fn()
  const mockMarkerConstructor = jest.fn(markerObj => {
    // Return an object with a mock for setPosition(), that will be called by our component
    return { ...markerObj,
      setPosition: mockSetPosition
    }
  })
  const mockAddListener = jest.fn()

  global.google = {
    maps: {
      Marker: mockMarkerConstructor,
      event: {
        addListener: mockAddListener
      }
    }
  }

  // Create component, then set the props
  const component = shallow(
    <RfpTargetsMap targets={[]}
      selectedTarget={null}
    />
  )
  component.setProps({ targets: targets })
  // Make sure the mock functions are called
  const constructorParams = targets.map(target => ([{
    draggable: true,
    icon: '/images/map_icons/aro/target.png',
    id: target.id,
    map: undefined,
    position: {
      lat: target.lat,
      lng: target.lng
    }
  }]))
  expect(mockMarkerConstructor.mock.calls).toEqual(constructorParams)

  const setPositionParams = targets.map(target => ([{
    lat: target.lat,
    lng: target.lng
  }]))
  expect(mockSetPosition.mock.calls).toEqual(setPositionParams)

  targets.forEach((target, index) => {
    expect(mockAddListener.mock.calls[index][1]).toEqual('dragend')
  })
})

// -----------------------------------------------------------------------------
test('With targets and one selection', () => {
  // First mock all the google maps global object
  const mockSetIcon = jest.fn()
  const mockMarkerConstructor = jest.fn(markerObj => {
    // Return an object with a mock for setPosition(), that will be called by our component
    return { ...markerObj,
      setPosition: jest.fn(),
      setIcon: mockSetIcon
    }
  })

  global.google = {
    maps: {
      Marker: mockMarkerConstructor,
      event: {
        addListener: jest.fn()
      }
    }
  }

  const mockGoogleMaps = {
    panTo: jest.fn()
  }

  // Create component, then set the props
  const component = shallow(
    <RfpTargetsMap targets={[]}
      selectedTarget={null}
      googleMaps={mockGoogleMaps}
    />
  )
  component.setProps({ targets: targets, selectedTarget: targets[1] })

  // Make sure the setIcon() function is called
  expect(mockSetIcon.mock.calls).toEqual([
    [{ url: '/images/map_icons/aro/target_selected.png' }]
  ])
  // Make sure the panto() function is called
  expect(mockGoogleMaps.panTo.mock.calls).toEqual([
    [{ lat: targets[1].lat, lng: targets[1].lng }]
  ])

  // Select another target
  mockSetIcon.mockReset()
  mockGoogleMaps.panTo.mockReset()
  component.setProps({ targets: targets, selectedTarget: targets[0] })
  expect(mockSetIcon.mock.calls).toEqual([
    [{ url: '/images/map_icons/aro/target.png' }], // Resetting icon for earlier selected marker
    [{ url: '/images/map_icons/aro/target_selected.png' }] // Setting icon for currently selected marker
  ])
  // Make sure the panto() function is called
  expect(mockGoogleMaps.panTo.mock.calls).toEqual([
    [{ lat: targets[0].lat, lng: targets[0].lng }]
  ])
})

// -----------------------------------------------------------------------------
test('When marker is dragged', () => {
  // First mock all the google maps global object
  const mockMarkerConstructor = jest.fn(markerObj => {
    // Return an object with a mock for setPosition(), that will be called by our component
    return { ...markerObj,
      setPosition: jest.fn(),
      setIcon: jest.fn()
    }
  })

  var dragEndHandler = null
  global.google = {
    maps: {
      Marker: mockMarkerConstructor,
      event: {
        addListener: jest.fn((mapObj, event, handler) => { dragEndHandler = handler })
      }
    }
  }

  const mockGoogleMaps = {
    panTo: jest.fn()
  }

  // Create component
  const mockReplaceTarget = jest.fn()
  const component = shallow(
    <RfpTargetsMap targets={[]}
      selectedTarget={null}
      googleMaps={mockGoogleMaps}
      replaceTarget={mockReplaceTarget}
    />
  )
  component.setProps({ targets: [targets[0]] })

  // At this point the dragEndHandler should be defined. Call it to make sure our props are called
  const newLatLng = { lat: 47.555, lng: -122.777 }
  dragEndHandler({
    latLng: {
      lat: () => newLatLng.lat,
      lng: () => newLatLng.lng
    }
  })
  expect(mockReplaceTarget.mock.calls).toEqual([
    [0, new Point(newLatLng.lat, newLatLng.lng, 1)]
  ])
})
