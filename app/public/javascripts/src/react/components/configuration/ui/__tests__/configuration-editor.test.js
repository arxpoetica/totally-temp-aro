/* global test expect */
import React from 'react'
import { shallow } from 'enzyme'
import { ConfigurationEditor } from '../configuration-editor'

const sampleConfiguration = {
  locationCategories: {
    medium_business: {
      label: 'Medium businesses'
    }
  }
}

// -----------------------------------------------------------------------------
test('Component render - default and after clicking button', () => {
  const component = shallow(
    <ConfigurationEditor initialConfiguration={sampleConfiguration} />
  )
  // Initial state - show warning, hide form
  expect(component).toMatchSnapshot()
  expect(component.find('#divConfigurationWarning').exists()).toBeTruthy()
  expect(component.find('#compSettingsEditor').exists()).toBeFalsy()
  component.find('#btnAcceptConfigurationWarning').simulate('click')

  // New state - hide warning, show form
  expect(component.find('#divConfigurationWarning').exists()).toBeFalsy()
  expect(component.find('#compSettingsEditor').exists()).toBeTruthy()
  //expect(component).toMatchSnapshot()
})
