/* global test expect */
import React from 'react'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import { ConfigurationEditor } from '../configuration/configuration-editor'

const sampleConfiguration = {
  locationCategories: {
    medium_business: {
      label: 'Medium businesses'
    }
  }
}

// -----------------------------------------------------------------------------
test('Default component render', () => {
  const component = renderer.create(
    <ConfigurationEditor initialConfiguration={sampleConfiguration} />
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Component render - default and after clicking button', () => {
  const component = shallow(
    <ConfigurationEditor initialConfiguration={sampleConfiguration} />
  )
  // Initial state - show warning, hide form
  expect(component.find('#divConfigurationWarning').exists()).toBeTruthy()
  expect(component.find('#divConfigurationForm').exists()).toBeFalsy()
  component.find('#btnAcceptConfigurationWarning').simulate('click')

  // New state - hide warning, show form
  expect(component.find('#divConfigurationWarning').exists()).toBeFalsy()
  expect(component.find('#divConfigurationForm').exists()).toBeTruthy()
})
