import React from 'react'
import { shallow } from 'enzyme'
import { RingEdit } from '../ring-edit'
import RingStatusTypes from '../constants'
import Ring from '../../../common/ring'
import RingTestData from '../testData/ringTestData'

const mockSetMap = jest.fn()
const mockSetPosition = jest.fn()
const mockGetPath = jest.fn()
const mockSetOptions = jest.fn()
const mockMarkerConstructor = jest.fn(markerObj => {
  return { ...markerObj,
    setMap: mockSetMap
  }
})
const mockPolylineConstructor = jest.fn(polylineObj => {
  return { ...polylineObj,
    setMap: mockSetMap
  }
})
const mockPolygonConstructor = jest.fn(polygonObj => {
  return { ...polygonObj,
    setMap: mockSetMap,
    setOptions: mockSetOptions,
    getPath: mockGetPath
  }
})
const mockLatLngConstructor = jest.fn(latLngObj => {
  // Return an object with a mock for setPosition(), that will be called by our component
  return latLngObj
})
const mockAddListener = jest.fn()

const globalGoogle = {
  maps: {
    Marker: mockMarkerConstructor,
    Polygon: mockPolygonConstructor,
    Polyline: mockPolylineConstructor,
    LatLng: mockLatLngConstructor,
    event: {
      addListener: mockAddListener
    },
    setOptions: () => {}
  }
}

function getRings () {
  global.google = globalGoogle
  var ring48 = Ring.parseData(RingTestData.ringData48, RingTestData.ringEq48)
  var ring49 = Ring.parseData(RingTestData.ringData49, RingTestData.ringEq49)

  return {
    '48': ring48,
    '49': ring49
  }
}

//var rings = getRings()

test('With no rings', () => {
  const mockSetSelectedRingId = jest.fn()
  const component = shallow(
    <RingEdit rings={{}}
      setSelectedRingId={mockSetSelectedRingId}
    />
  )
  expect(component).toMatchSnapshot()
})

test("With rings, can't edit", () => {
  global.google = globalGoogle
  const mockSetSelectedRingId = jest.fn()
  const mockGoogleMaps = {}
  var rings = getRings()

  const component = shallow(
    <RingEdit rings={rings}
      setSelectedRingId={mockSetSelectedRingId}
      map={{googleMaps: mockGoogleMaps}}
      status={RingStatusTypes.COMPLETED}
    />
  )
  expect(component).toMatchSnapshot()
})



