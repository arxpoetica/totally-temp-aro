import React from 'react'
import { shallow } from 'enzyme'
import { RingEdit } from '../ring-edit'

test('With no rings', () => {
  const mockSetSelectedRingId = jest.fn()
  const component = shallow(
    <RingEdit rings={{}}
      setSelectedRingId={mockSetSelectedRingId}
    />
  )
  expect(component).toMatchSnapshot()
})