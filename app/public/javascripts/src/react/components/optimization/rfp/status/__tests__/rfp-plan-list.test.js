/* global jest test expect */
import React from 'react'
import { shallow } from 'enzyme'
import { RfpPlanList } from '../rfp-plan-list.jsx'

// Create a bunch of RFP plans so we can test the pagination
var rfpPlans = []
for (var iPlan = 0; iPlan < 30; ++iPlan) {
  rfpPlans.push({
    id: iPlan,
    name: `RFP Plan ${iPlan}`,
    createdBy: 4
  })
}

// -----------------------------------------------------------------------------
test('Component initialization and teardown', () => {
  const mockLoadRfpPlans = jest.fn()
  const mockClearRfpPlans = jest.fn()
  const component = shallow(
    <RfpPlanList
      rfpPlans={[]}
      userId={42}
      loadRfpPlans={mockLoadRfpPlans}
      clearRfpPlans={mockClearRfpPlans}
    />
  )
  expect(mockLoadRfpPlans).toHaveBeenCalledWith(42)

  component.unmount()
  expect(mockClearRfpPlans).toHaveBeenCalled()
})

// -----------------------------------------------------------------------------
test('Component pagination render', () => {
  const mockLoadRfpPlans = jest.fn()
  const component = shallow(
    <RfpPlanList
      rfpPlans={rfpPlans}
      userId={42}
      planListOffset={0}
      planListLimit={10}
      loadRfpPlans={mockLoadRfpPlans}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Component pagination navigation', () => {
  const mockLoadRfpPlans = jest.fn()
  const mockSetPlanListOffset = jest.fn()
  const PLANS_PER_PAGE = 10
  const component = shallow(
    <RfpPlanList
      rfpPlans={rfpPlans}
      userId={42}
      planListOffset={0}
      planListLimit={PLANS_PER_PAGE}
      loadRfpPlans={mockLoadRfpPlans}
      setPlanListOffset={mockSetPlanListOffset}
    />
  )
  // We are at page 1
  expect(component).toMatchSnapshot()
  component.find('#rfpPageNext').simulate('click')
  // We are at page 2
  expect(mockSetPlanListOffset).toHaveBeenCalledWith(1 * PLANS_PER_PAGE)
  component.setProps({ planListOffset: PLANS_PER_PAGE })
  expect(component).toMatchSnapshot()
  component.find('#rfpPagePrev').simulate('click')
  // We are at page 1
  expect(mockSetPlanListOffset).toHaveBeenCalledWith(0 * PLANS_PER_PAGE)
  component.setProps({ planListOffset: 0 })

  // Click on page 2
  expect(component).toMatchSnapshot()
  component.find('#rfpPage_2').simulate('click')
  component.setProps({ planListOffset: PLANS_PER_PAGE })
  expect(mockSetPlanListOffset).toHaveBeenCalledWith(1 * PLANS_PER_PAGE)

  // Click on page 3
  expect(component).toMatchSnapshot()
  component.find('#rfpPage_3').simulate('click')
  component.setProps({ planListOffset: 2 * PLANS_PER_PAGE })
  expect(mockSetPlanListOffset).toHaveBeenCalledWith(2 * PLANS_PER_PAGE)

  expect(component).toMatchSnapshot()
})
