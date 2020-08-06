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

// -----------------------------------------------------------------------------
test('should call onChange prop with input value', () => {
  const onChangeMock = jest.fn()
  const component = shallow(<Broadcast
    handleSubjectChange={onChangeMock}
    handleBodyChange={onChangeMock} />)
  component.find('[type="text"]').simulate('change', { target: { value: 'Alert' } })
  component.find('textarea').simulate('change', { target: { value: 'Shutdown' } })

  expect(component.state('subject')).toEqual('Alert')
  expect(component.state('body')).toEqual('Shutdown')
})
