/* global test expect jest */
import React from 'react'
import { shallow } from 'enzyme'
import { RfpTargets } from '../rfp-targets'
import Point from '../../../../common/point'
// Return the same UUID for deterministic tests
import uuidv4 from 'uuid/v4'
jest.mock('uuid/v4')
uuidv4.mockImplementation(() => '2d897638-960e-40b3-b25b-5356d3e6c865')

const targets = [
  new Point(47.58444322, -122.330330, 1),
  new Point(47.59, -122.34, 2),
  new Point(47.57, -122.32, 3)
]

// -----------------------------------------------------------------------------
test('With no targets', () => {
  const component = shallow(
    <RfpTargets targets={[]}
      selectedTarget={null}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('With targets, no selection', () => {
  const component = shallow(
    <RfpTargets targets={targets}
      selectedTarget={null}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('With targets and one selection', () => {
  const component = shallow(
    <RfpTargets targets={targets}
      selectedTarget={targets[1]}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Click to select a target', () => {
  const mockSetSelectedTarget = jest.fn()
  const component = shallow(
    <RfpTargets targets={targets}
      selectedTarget={null}
      setSelectedTarget={mockSetSelectedTarget}
    />
  )
  expect(component).toMatchSnapshot()
  component.find('#trTarget_0').simulate('click')
  expect(mockSetSelectedTarget).toHaveBeenCalledWith(targets[0])
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Click to edit a target', () => {
  const mockReplaceTarget = jest.fn()
  const component = shallow(
    <RfpTargets targets={targets}
      selectedTarget={null}
      replaceTarget={mockReplaceTarget}
    />
  )
  expect(component).toMatchSnapshot()

  // Start editing a target
  const indexToEdit = 0
  component.find(`#btnEditTarget_${indexToEdit}`).simulate('click')
  expect(component).toMatchSnapshot()

  // Change the value of the target
  component.find(`#inpTargetLatitude_${indexToEdit}`).simulate('change', { target: { value: '47.11111' } })
  component.find(`#inpTargetLongitude_${indexToEdit}`).simulate('change', { target: { value: '-122.33333' } })
  expect(component).toMatchSnapshot()

  // Save the changes
  const mockStopEventPropagation = jest.fn()
  component.find(`#btnSaveTarget_${indexToEdit}`).simulate('click', { stopPropagation: mockStopEventPropagation })
  expect(mockStopEventPropagation).toHaveBeenCalled()
  expect(mockReplaceTarget).toHaveBeenCalledWith(indexToEdit, { id: 1, lat: 47.11111, lng: -122.33333 })
  // Note that the actual target value has not changed, so the next snapshot will show old lat/long values.
  // But we still check the snapshot to make sure that the input boxes are gone and just the <td>'s are rendered.
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Click to delete a target', () => {
  const mockRemoveTarget = jest.fn()
  const component = shallow(
    <RfpTargets targets={targets}
      selectedTarget={null}
      removeTarget={mockRemoveTarget}
    />
  )
  expect(component).toMatchSnapshot()
  const mockStopEventPropagation = jest.fn()
  component.find('#btnDeleteTarget_2').simulate('click', { stopPropagation: mockStopEventPropagation })
  expect(mockRemoveTarget).toHaveBeenCalledWith(2)
  expect(mockStopEventPropagation).toHaveBeenCalled()
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Click to manually add a target', () => {
  const mockAddTargets = jest.fn()
  const mockSetClickMapToAddTarget = jest.fn()
  const component = shallow(
    <RfpTargets targets={targets}
      selectedTarget={null}
      addTargets={mockAddTargets}
      setClickMapToAddTarget={mockSetClickMapToAddTarget}
      defaultLatitude={47.877}
      defaultLongitude={-122.235}
    />
  )
  expect(component).toMatchSnapshot()
  component.find('#btnAddTargetManual').simulate('click')
  expect(component).toMatchSnapshot()
  expect(mockSetClickMapToAddTarget).toHaveBeenCalledWith(false)
  component.find('#btnSaveTarget').simulate('click')
  expect(component).toMatchSnapshot()
  expect(mockAddTargets.mock.calls.length).toBe(1)
})
