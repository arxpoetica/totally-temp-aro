import React from 'react'
import renderer from 'react-test-renderer'
import { CoverageButton } from '../coverage-button'
import CoverageStatusTypes from '../constants'

// -----------------------------------------------------------------------------
test('When the user does not have a coverage report', () => {
  const component = renderer.create(
    <CoverageButton status={CoverageStatusTypes.UNINITIALIZED}></CoverageButton>
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When the user has a coverage report', () => {
  const component = renderer.create(
    <CoverageButton status={CoverageStatusTypes.FINISHED}></CoverageButton>
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When a coverage report is running at 10% progress', () => {
  const component = renderer.create(
    <CoverageButton status={CoverageStatusTypes.RUNNING} progress={0.1}></CoverageButton>
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})
