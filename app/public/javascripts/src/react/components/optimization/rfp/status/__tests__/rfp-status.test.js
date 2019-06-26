/* global test expect jest */
import React from 'react'
import { shallow } from 'enzyme'
import { RfpStatus } from '../rfp-status.jsx'

const tabs = [
  { id: 'LIST_PLANS', description: 'List all plans' },
  { id: 'SUBMIT_RFP', description: 'Submit RFP' },
  { id: 'MANAGE_RFP_TEMPLATES', description: 'Manage RFP templates' }
]

// -----------------------------------------------------------------------------
test('Default render and tab navigation', () => {
  const mockSetSelectedTabId = jest.fn()
  const component = shallow(
    <RfpStatus
      tabs={tabs}
      selectedTabId={tabs[0].id}
      setSelectedTabId={mockSetSelectedTabId}
    />
  )
  expect(component).toMatchSnapshot()

  component.find('#rfpStatusTab_SUBMIT_RFP').simulate('click')
  expect(component).toMatchSnapshot()
  expect(mockSetSelectedTabId).toHaveBeenCalledWith('SUBMIT_RFP')

  component.find('#rfpStatusTab_MANAGE_RFP_TEMPLATES').simulate('click')
  expect(component).toMatchSnapshot()
  expect(mockSetSelectedTabId).toHaveBeenCalledWith('MANAGE_RFP_TEMPLATES')

  component.find('#rfpStatusTab_LIST_PLANS').simulate('click')
  expect(component).toMatchSnapshot()
  expect(mockSetSelectedTabId).toHaveBeenCalledWith('LIST_PLANS')
})

// -----------------------------------------------------------------------------
test('RFP state cleared on unmount', () => {
  const mockClearRfpState = jest.fn()
  const component = shallow(
    <RfpStatus
      tabs={tabs}
      selectedTabId={tabs[0].id}
      clearRfpState={mockClearRfpState}
    />
  )
  component.unmount()
  expect(mockClearRfpState).toHaveBeenCalled()
})
