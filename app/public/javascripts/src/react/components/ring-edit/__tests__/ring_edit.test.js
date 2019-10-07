import React from 'react'
import { shallow } from 'enzyme'
import { RingEdit } from '../ring-edit'
import RingStatusTypes from '../constants'
import Ring from '../../../common/ring'
import RingTestData from '../testData/ringTestData'

const plan = {activePlan: {id: 1}}
const user = {loggedInUser: {id: 2}}
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
    SymbolPath: {
      CIRCLE: 'CIRCLE'
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

// -----------------------------------------------------------------------------
test('With no rings', () => {
  const mockSetSelectedRingId = jest.fn()
  const component = shallow(
    <RingEdit rings={{}}
      setSelectedRingId={mockSetSelectedRingId}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test("Can't edit", () => {
  global.google = globalGoogle
  const mockSetSelectedRingId = jest.fn()
  const mockGoogleMaps = {}
  var rings = getRings()
  const ringId = 48
  const nodeId = RingTestData.ringEq48[0].objectId

  const component = shallow(
    <RingEdit rings={rings}
      setSelectedRingId={mockSetSelectedRingId}
      map={{googleMaps: mockGoogleMaps}}
      status={RingStatusTypes.COMPLETED}
      selectedRingId={ringId}
      plan={plan}
      user={user}
    />
  )
  expect(component).toMatchSnapshot()
  // no ring del button
  expect(component.exists(`btnRingDel_${ringId}`)).toBe(false)
  // no rename field
  expect(component.exists(`inpRingName_${ringId}`)).toBe(false)
  // no node del buton
  expect(component.exists(`btnNodeDel_${ringId}-${nodeId}`)).toBe(false)
})

// -----------------------------------------------------------------------------
test('Can edit', () => {
  global.google = globalGoogle
  const mockSetSelectedRingId = jest.fn()
  const mockGoogleMaps = {}
  var rings = getRings()
  const ringId = 48
  const nodeId = RingTestData.ringEq48[0].objectId

  const component = shallow(
    <RingEdit rings={rings}
      setSelectedRingId={mockSetSelectedRingId}
      map={{googleMaps: mockGoogleMaps}}
      status={RingStatusTypes.START_STATE}
      selectedRingId={ringId}
      plan={plan}
      user={user}
    />
  )
  expect(component).toMatchSnapshot()
  // ring del btn
  expect(component.exists(`#btnRingDel_${ringId}`)).toBe(true)
  // rename field
  expect(component.exists(`#inpRingName_${ringId}`)).toBe(true)
  // node del btn
  expect(component.exists(`#btnNodeDel_${ringId}-${nodeId}`)).toBe(true)
})

// -----------------------------------------------------------------------------
test('Select ring', () => {
  global.google = globalGoogle
  const mockSetSelectedRingId = jest.fn()
  const mockGoogleMaps = {}
  var rings = getRings()
  const ringId = 48
  const unselectedRingId = 49
  const nodeId = RingTestData.ringEq48[0].objectId

  const component = shallow(
    <RingEdit rings={rings}
      setSelectedRingId={mockSetSelectedRingId}
      map={{googleMaps: mockGoogleMaps}}
      status={RingStatusTypes.START_STATE}
      selectedRingId={ringId}
      plan={plan}
      user={user}
    />
  )
  
  component.find(`#btnRingSelect_${unselectedRingId}`).simulate('click')
  expect(mockSetSelectedRingId).toHaveBeenCalledWith(unselectedRingId)
})

// -----------------------------------------------------------------------------
test('Rename ring', () => {
  global.google = globalGoogle
  const mockSetSelectedRingId = jest.fn()
  const mockRenameRing = jest.fn()
  const mockGoogleMaps = {}
  var rings = getRings()
  const ringId = 48
  const newName = 'new ring name'

  const component = shallow(
    <RingEdit rings={rings}
      setSelectedRingId={mockSetSelectedRingId}
      renameRing={mockRenameRing}
      map={{googleMaps: mockGoogleMaps}}
      status={RingStatusTypes.START_STATE}
      selectedRingId={ringId}
      plan={plan}
      user={user}
    />
  )
  
  component.find(`#inpRingName_${ringId}`).simulate('blur', { target: { value: newName } })
  expect(mockRenameRing).toHaveBeenCalledWith(rings[ringId], newName, plan.activePlan.id, user.loggedInUser.id)
})

// -----------------------------------------------------------------------------
test('Delete node', () => {
  global.google = globalGoogle
  const mockSetSelectedRingId = jest.fn()
  const mockRemoveNode = jest.fn()
  const mockGoogleMaps = {}
  var rings = getRings()
  const ringId = 48
  const nodeId = RingTestData.ringEq48[1].objectId

  const component = shallow(
    <RingEdit rings={rings}
      setSelectedRingId={mockSetSelectedRingId}
      removeNode={mockRemoveNode}
      map={{googleMaps: mockGoogleMaps}}
      status={RingStatusTypes.START_STATE}
      selectedRingId={ringId}
      plan={plan}
      user={user}
    />
  )
  
  component.find(`#btnNodeDel_${ringId}-${nodeId}`).simulate('click')
  expect(mockRemoveNode).toHaveBeenCalledWith(rings[ringId], nodeId, plan.activePlan.id, user.loggedInUser.id)
})

// -----------------------------------------------------------------------------
test('Delete ring', () => {
  // ToDo: need to mock click in swal 
  // currently we just test is swal comes up
  global.google = globalGoogle
  global.swal = jest.fn()
  const mockSetSelectedRingId = jest.fn()
  const mockRemoveRing = jest.fn()
  const mockGoogleMaps = {}
  var rings = getRings()
  const ringId = 48

  const component = shallow(
    <RingEdit rings={rings}
      setSelectedRingId={mockSetSelectedRingId}
      removeRing={mockRemoveRing}
      map={{googleMaps: mockGoogleMaps}}
      status={RingStatusTypes.START_STATE}
      selectedRingId={ringId}
      plan={plan}
      user={user}
    />
  )
  
  component.find(`#btnRingDel_${ringId}`).simulate('click')
  expect(component).toMatchSnapshot()
  // expect(mockRemoveRing).toHaveBeenCalledWith(ringId, plan.activePlan.id, user.loggedInUser.id)
})