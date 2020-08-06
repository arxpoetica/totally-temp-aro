/* global test expect */
import React from 'react'
import renderer from 'react-test-renderer'
import { SettingsEditor } from '../settings-editor'

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
    <SettingsEditor initialConfiguration={sampleConfiguration} />
  )
  expect(component).toMatchSnapshot()
})
