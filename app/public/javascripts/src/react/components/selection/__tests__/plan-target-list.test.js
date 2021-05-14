/* global test expect jest */
import React from 'react'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import { PlanTargetList } from '../plan-target-list'
import SelectionModes from '../../selection/selection-modes'

// -----------------------------------------------------------------------------
test('Render when all plan targets are empty', () => {
  const component = renderer.create(
    <PlanTargetList planId={1}
      activeSelectionModeId={SelectionModes.SELECTED_LOCATIONS}
      planTargets={{ locations: new Set(), serviceAreas: new Set(), analysisAreas: new Set() }}
      planTargetDescriptions={{}}
      maxRoutingSelectionDisplayCount={2000}
    />
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Render when location targets are being shown', () => {
  const planTargets = {
    locations: new Set([100, 200, 999]),
    serviceAreas: new Set(),
    analysisAreas: new Set()
  }

  const planTargetDescriptions = {
    locations: {
      100: { address: 'Test address 1' },
      999: { address: 'Test address 2' } // Note that we are intentionally keeping id 200 blank
    },
    serviceAreas: {},
    analysisAreas: {}
  }

  const component = renderer.create(
    <PlanTargetList planId={1}
      activeSelectionModeId={SelectionModes.SELECTED_LOCATIONS}
      planTargets={planTargets}
      planTargetDescriptions={planTargetDescriptions}
      maxRoutingSelectionDisplayCount={2000}
    />
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Render when service area targets are being shown', () => {
  const planTargets = {
    locations: new Set(),
    serviceAreas: new Set([100, 200, 999]),
    analysisAreas: new Set()
  }

  const planTargetDescriptions = {
    locations: {},
    serviceAreas: {
      100: { code: 'STTLWA09' },
      200: { code: 'STTLWAXX' } // Note that we are intentionally keeping id 999 blank
    },
    analysisAreas: {}
  }

  const component = renderer.create(
    <PlanTargetList planId={1}
      activeSelectionModeId={SelectionModes.SELECTED_AREAS}
      planTargets={planTargets}
      planTargetDescriptions={planTargetDescriptions}
      maxRoutingSelectionDisplayCount={2000}
    />
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Render when analysis area targets are being shown', () => {
  const planTargets = {
    locations: new Set(),
    serviceAreas: new Set(),
    analysisAreas: new Set([100, 200, 999])
  }

  const planTargetDescriptions = {
    locations: {},
    serviceAreas: {},
    analysisAreas: {
      100: { code: 'Seattle' },
      200: { code: 'More seattle' } // Note that we are intentionally keeping id 999 blank
    }
  }

  const component = renderer.create(
    <PlanTargetList planId={1}
      activeSelectionModeId={SelectionModes.SELECTED_ANALYSIS_AREAS}
      planTargets={planTargets}
      planTargetDescriptions={planTargetDescriptions}
      maxRoutingSelectionDisplayCount={2000}
    />
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
// Helper function to test removal of plan targets
const testRemovingPlanTarget = (targetKey, selectionMode) => {
  const planTargets = {
    locations: new Set(),
    serviceAreas: new Set(),
    analysisAreas: new Set()
  }
  planTargets[targetKey] = new Set([100, 200, 999])

  const planTargetDescriptions = {
    locations: {},
    serviceAreas: {},
    analysisAreas: {}
  }

  // Then try to delete one plan target
  const mockRemovePlanTargets = jest.fn()
  var component = shallow(
    <PlanTargetList planId={1}
      activeSelectionModeId={selectionMode}
      planTargets={planTargets}
      planTargetDescriptions={planTargetDescriptions}
      removePlanTargets={mockRemovePlanTargets}
      maxRoutingSelectionDisplayCount={2000}
    />
  )
  component.find('div > ul > li > button').at(0).simulate('click')
  expect(mockRemovePlanTargets.mock.calls[0][0]).toEqual(1)
  var setOfTargets = mockRemovePlanTargets.mock.calls[0][1][targetKey]
  expect(setOfTargets.has(100)).toBeTruthy()
  expect(setOfTargets.size).toEqual(1)

  // Now delete all the plan targets
  component = shallow(
    <PlanTargetList planId={1}
      activeSelectionModeId={selectionMode}
      planTargets={planTargets}
      planTargetDescriptions={planTargetDescriptions}
      removePlanTargets={mockRemovePlanTargets}
      maxRoutingSelectionDisplayCount={2000}
    />
  )
  component.find('div > div > button').simulate('click')
  expect(mockRemovePlanTargets.mock.calls[1][0]).toEqual(1)
  setOfTargets = mockRemovePlanTargets.mock.calls[1][1][targetKey]
  expect(setOfTargets.has(100)).toBeTruthy()
  expect(setOfTargets.has(200)).toBeTruthy()
  expect(setOfTargets.has(999)).toBeTruthy()
  expect(setOfTargets.size).toEqual(3)
}

// -----------------------------------------------------------------------------
test('Ability to remove location targets - single and multiple', () => {
  testRemovingPlanTarget('locations', SelectionModes.SELECTED_LOCATIONS)
})

// -----------------------------------------------------------------------------
test('Ability to remove service area targets - single and multiple', () => {
  testRemovingPlanTarget('serviceAreas', SelectionModes.SELECTED_AREAS)
})

// -----------------------------------------------------------------------------
test('Ability to remove analysis area targets - single and multiple', () => {
  testRemovingPlanTarget('analysisAreas', SelectionModes.SELECTED_ANALYSIS_AREAS)
})
