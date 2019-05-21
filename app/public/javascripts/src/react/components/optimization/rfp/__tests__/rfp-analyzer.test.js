/* global test expect jest */
import React from 'react'
import { shallow } from 'enzyme'
import { RfpAnalyzer } from '../rfp-analyzer'

// -----------------------------------------------------------------------------
test('Default component render', () => {
  const mockInitialize = jest.fn()
  const mockClearState = jest.fn()
  const component = shallow(
    <RfpAnalyzer initialize={mockInitialize}
      clearState={mockClearState}
    />
  )
  expect(component).toMatchSnapshot()
  expect(mockInitialize.mock.calls.length).toBe(1)
  component.unmount()
  expect(mockClearState.mock.calls.length).toBe(1)
})
