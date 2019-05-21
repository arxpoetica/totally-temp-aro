/* global test expect */
import React from 'react'
import { shallow } from 'enzyme'
import { RfpOptions } from '../rfp-options'

const options = {
  fiberRoutingMode: {
    displayName: 'Fiber routing mode',
    value: 'ROUTE_FROM_FIBER'
  }
}

// -----------------------------------------------------------------------------
test('Default options render', () => {
  const component = shallow(
    <RfpOptions initialValues={options} />
  )
  expect(component).toMatchSnapshot()
})
