/* global test expect jest */
import React from 'react'
import renderer from 'react-test-renderer'
import { StylesheetManager } from '../stylesheets-manager'
import { shallow } from 'enzyme'

const sampleConfiguration = '.test{ background-color:red}'

// -----------------------------------------------------------------------------
test('Default Stylesheet component render', () => {
  const component = renderer.create(
    <StylesheetManager styleValues={sampleConfiguration} />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('should call onChange prop with input value', () => {
  const onChangeMock = jest.fn()
  const component = shallow(<StylesheetManager
    handleChanges={onChangeMock} />)
  component.find('textarea').simulate('change', { target: { value: '.tool-bar {background-color: #00ff00;} ' } })
  expect(component.state('styleValues')).toEqual('.tool-bar {background-color: #00ff00;} ')
})
