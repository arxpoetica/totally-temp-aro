/* global test expect */
import React from 'react'
import { shallow } from 'enzyme'
import { RfpAnalyzer } from '../rfp-analyzer'
import RfpStatusTypes from '../constants'

// -----------------------------------------------------------------------------
test('Default component render', () => {
  const component = shallow(
    <RfpAnalyzer
      status={RfpStatusTypes.UNINITIALIZED}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Rfp running status', () => {
  const component = shallow(
    <RfpAnalyzer
      status={RfpStatusTypes.RUNNING}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Rfp finished status', () => {
  const component = shallow(
    <RfpAnalyzer
      status={RfpStatusTypes.FINISHED}
    />
  )
  expect(component).toMatchSnapshot()
})
