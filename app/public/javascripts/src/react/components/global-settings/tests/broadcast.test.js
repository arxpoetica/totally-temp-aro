/* global test expect jest */
import React from 'react'
import renderer from 'react-test-renderer'
import { Broadcast } from '../broadcast'
import { shallow } from 'enzyme'

const sampleConfiguration = { subject: '', body: '' }
// -----------------------------------------------------------------------------
test('Default component render', () => {
  const component = renderer.create(
    <Broadcast initialConfiguration={sampleConfiguration} />
  )
  expect(component).toMatchSnapshot()
})
