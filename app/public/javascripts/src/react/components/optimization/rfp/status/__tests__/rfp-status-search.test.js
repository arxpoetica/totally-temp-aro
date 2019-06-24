/* global jest test expect */
import React from 'react'
import { shallow } from 'enzyme'
import { RfpStatusSearch } from '../rfp-status-search.jsx'

// -----------------------------------------------------------------------------
test('When system is loading RFP plans', () => {
  const component = shallow(
    <RfpStatusSearch
      isLoadingRfpPlans
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When system is not loading RFP plans', () => {
  const component = shallow(
    <RfpStatusSearch
      isLoadingRfpPlans={false}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When user clicks on button to search', () => {
  const userId = 42
  const mockLoadRfpPlans = jest.fn()
  const component = shallow(
    <RfpStatusSearch
      isLoadingRfpPlans={false}
      userId={userId}
      loadRfpPlans={mockLoadRfpPlans}
    />
  )
  const searchTerm = 'Rfp Plan'
  component.find('#txtRfpPlanSearch').simulate('change', { target: { value: searchTerm } })
  component.find('#btnRfpPlanSearch').simulate('click')
  expect(mockLoadRfpPlans).toHaveBeenCalledWith(userId, searchTerm)
})

// -----------------------------------------------------------------------------
test('When user presses enter key to search', () => {
  const userId = 42
  const mockLoadRfpPlans = jest.fn()
  const component = shallow(
    <RfpStatusSearch
      isLoadingRfpPlans={false}
      userId={userId}
      loadRfpPlans={mockLoadRfpPlans}
    />
  )
  const searchTerm = 'Rfp Plan'
  component.find('#txtRfpPlanSearch').simulate('change', { target: { value: searchTerm } })
  component.find('#txtRfpPlanSearch').simulate('keyPress', { key: 'Enter' })
  expect(mockLoadRfpPlans).toHaveBeenCalledWith(userId, searchTerm)
})
