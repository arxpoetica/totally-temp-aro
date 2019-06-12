/* global test expect jest */
import React from 'react'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import { CoverageInitializer } from '../coverage-initializer'
import SelectionModes from '../../selection/selection-modes'

// Constants to use throughout the tests
const selectionModes = [
  { id: SelectionModes.SELECTED_AREAS, description: 'Service Areas' },
  { id: SelectionModes.SELECTED_LOCATIONS, description: 'Locations' },
  { id: SelectionModes.SELECTED_ANALYSIS_AREAS, description: 'Analysis Areas' },
  { id: SelectionModes.SELECTED_ALL_SERVICE_AREAS, description: 'All Service Areas' }
]

// -----------------------------------------------------------------------------
test('Default render', () => {
  const component = renderer.create(
    <CoverageInitializer
      selectionModes={selectionModes}
    />
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When we do not have an existing report', () => {
  const component = renderer.create(
    <CoverageInitializer isSuperUser
      selectionModes={selectionModes}
      coverageReport={null}
    />
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When we have an existing report', () => {
  const component = renderer.create(
    <CoverageInitializer isSuperUser
      selectionModes={selectionModes}
      coverageReport={{}}
    />
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When we have supplied all parameters', () => {
  const component = renderer.create(
    <CoverageInitializer isSuperUser
      activeSelectionModeId={SelectionModes.SELECTED_AREAS}
      selectionModes={selectionModes}
      coverageType={'location'}
      groupKey={'serviceArea'}
      useMarketableTechnologies
      useMaxSpeed
      useExistingFiber
      usePlannedFiber
      coverageReport={{}}
    />
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When the coverage type is changed', () => {
  const mockSetCoverageType = jest.fn()
  const component = shallow(
    <CoverageInitializer isSuperUser
      activeSelectionModeId={SelectionModes.SELECTED_AREAS}
      selectionModes={selectionModes}
      coverageType={'location'}
      groupKey={'serviceArea'}
      useMarketableTechnologies
      useMaxSpeed
      useExistingFiber
      usePlannedFiber
      coverageReport={{}}
      setCoverageType={mockSetCoverageType}
    />
  )
  component.find('#selectCoverageType').simulate('change', { target: { value: 'census_block' } })
  expect(mockSetCoverageType.mock.calls[0][0]).toEqual('census_block')
})

// -----------------------------------------------------------------------------
test('When the group key type is changed', () => {
  const mockSetGroupKeyType = jest.fn()
  const component = shallow(
    <CoverageInitializer isSuperUser
      activeSelectionModeId={SelectionModes.SELECTED_AREAS}
      selectionModes={selectionModes}
      coverageType={'location'}
      groupKey={'serviceArea'}
      useMarketableTechnologies
      useMaxSpeed
      useExistingFiber
      usePlannedFiber
      coverageReport={{}}
      setGroupKeyType={mockSetGroupKeyType}
    />
  )
  component.find('#selectGroupKeyType').simulate('change', { target: { value: 'location' } })
  expect(mockSetGroupKeyType.mock.calls[0][0]).toEqual('location')
})

// -----------------------------------------------------------------------------
test('When the limit-marketable-technology flag is changed', () => {
  const mockSetLimitMarketableTechnology = jest.fn()
  const component = shallow(
    <CoverageInitializer isSuperUser
      activeSelectionModeId={SelectionModes.SELECTED_AREAS}
      selectionModes={selectionModes}
      coverageType={'location'}
      groupKey={'serviceArea'}
      useMarketableTechnologies
      useMaxSpeed
      useExistingFiber
      usePlannedFiber
      coverageReport={{}}
      setLimitMarketableTechnology={mockSetLimitMarketableTechnology}
    />
  )
  component.find('#chkLimitMarketableTechnologies').simulate('change', { target: { checked: false } })
  expect(mockSetLimitMarketableTechnology.mock.calls[0][0]).toEqual(false)
})

// -----------------------------------------------------------------------------
test('When the limit-max-speed flag is changed', () => {
  const mockSetLimitMaxSpeed = jest.fn()
  const component = shallow(
    <CoverageInitializer isSuperUser
      activeSelectionModeId={SelectionModes.SELECTED_AREAS}
      selectionModes={selectionModes}
      coverageType={'location'}
      groupKey={'serviceArea'}
      useMarketableTechnologies
      useMaxSpeed
      useExistingFiber
      usePlannedFiber
      coverageReport={{}}
      setLimitMaxSpeed={mockSetLimitMaxSpeed}
    />
  )
  component.find('#chkLimitMaxSpeed').simulate('change', { target: { checked: false } })
  expect(mockSetLimitMaxSpeed.mock.calls[0][0]).toEqual(false)
})

// -----------------------------------------------------------------------------
test('When the Existing Fiber flag is changed', () => {
  const mockSetExistingFiber = jest.fn()
  const component = shallow(
    <CoverageInitializer isSuperUser
      activeSelectionModeId={SelectionModes.SELECTED_AREAS}
      selectionModes={selectionModes}
      coverageType={'location'}
      groupKey={'serviceArea'}
      useMarketableTechnologies
      useMaxSpeed
      useExistingFiber
      usePlannedFiber
      coverageReport={{}}
      setExistingFiber={mockSetExistingFiber}
    />
  )
  component.find('#chkUseExistingFiber').simulate('change', { target: { checked: true } })
  expect(mockSetExistingFiber.mock.calls[0][0]).toEqual(true)
})

// -----------------------------------------------------------------------------
test('When the Planned Fiber flag is changed', () => {
  const mockSetPlannedFiber = jest.fn()
  const component = shallow(
    <CoverageInitializer isSuperUser
      activeSelectionModeId={SelectionModes.SELECTED_AREAS}
      selectionModes={selectionModes}
      coverageType={'location'}
      groupKey={'serviceArea'}
      useMarketableTechnologies
      useMaxSpeed
      useExistingFiber
      usePlannedFiber
      coverageReport={{}}
      setPlannedFiber={mockSetPlannedFiber}
    />
  )
  component.find('#chkUsePlannedFiber').simulate('change', { target: { checked: true } })
  expect(mockSetPlannedFiber.mock.calls[0][0]).toEqual(true)
})

// -----------------------------------------------------------------------------
test('When the selection type is changed', () => {
  const mockSetSelectionTypeById = jest.fn()
  const component = shallow(
    <CoverageInitializer isSuperUser
      activeSelectionModeId={SelectionModes.SELECTED_AREAS}
      selectionModes={selectionModes}
      coverageType={'location'}
      groupKey={'serviceArea'}
      useMarketableTechnologies
      useMaxSpeed
      useExistingFiber
      usePlannedFiber
      coverageReport={{}}
      setSelectionTypeById={mockSetSelectionTypeById}
    />
  )
  component.find('#selectCoverageInitializerSelectionType').simulate('change', { target: { value: SelectionModes.SELECTED_ANALYSIS_AREAS } })
  expect(mockSetSelectionTypeById.mock.calls[0][0]).toEqual(SelectionModes.SELECTED_ANALYSIS_AREAS)
})
