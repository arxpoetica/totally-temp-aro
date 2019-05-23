/* global test expect jest */
import React from 'react'
import { shallow } from 'enzyme'
import { RfpAnalyzer } from '../rfp-analyzer'
import RfpStatusTypes from '../constants'

// -----------------------------------------------------------------------------
test('Default component render', () => {
  const mockInitialize = jest.fn()
  const mockClearState = jest.fn()
  const component = shallow(
    <RfpAnalyzer initialize={mockInitialize}
      clearState={mockClearState}
      status={RfpStatusTypes.UNINITIALIZED}
    />
  )
  expect(component).toMatchSnapshot()
  expect(mockInitialize.mock.calls.length).toBe(1)
  component.unmount()
  expect(mockClearState.mock.calls.length).toBe(1)
})

// -----------------------------------------------------------------------------
test('Rfp running status', () => {
  const mockInitialize = jest.fn()
  const mockClearState = jest.fn()
  const component = shallow(
    <RfpAnalyzer initialize={mockInitialize}
      clearState={mockClearState}
      status={RfpStatusTypes.RUNNING}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Rfp finished status', () => {
  const mockInitialize = jest.fn()
  const mockClearState = jest.fn()
  const component = shallow(
    <RfpAnalyzer initialize={mockInitialize}
      clearState={mockClearState}
      status={RfpStatusTypes.FINISHED}
    />
  )
  expect(component).toMatchSnapshot()
})
