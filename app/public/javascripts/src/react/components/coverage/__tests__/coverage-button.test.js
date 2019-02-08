import React from 'react'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import sinon from 'sinon'
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

// -----------------------------------------------------------------------------
test('When button is clicked to initialize report', () => {
  const mockInitializeCoverageReport = sinon.spy()
  const component = shallow(
    <CoverageButton status={CoverageStatusTypes.UNINITIALIZED}
                    userId={5}
                    planId={22}
                    projectId={7}
                    activeSelectionModeId={'SELECTED_AREAS'}
                    initializationParams={{ generic: 'Init Params'}}
                    initializeCoverageReport={mockInitializeCoverageReport}></CoverageButton>
  )

  component.find('button').simulate('click')
  expect(mockInitializeCoverageReport.calledOnceWithExactly(
    5, 22, 7, 'SELECTED_AREAS', ['small', 'medium', 'large'], [], { generic: 'Init Params'})
  ).toBeTruthy()
})

// -----------------------------------------------------------------------------
test('When button is clicked to modify/delete report', () => {
  const mockModifyCoverageReport = sinon.spy()
  const component = shallow(
    <CoverageButton status={CoverageStatusTypes.FINISHED}
                    report={{ reportId: 100 }}
                    modifyCoverageReport={mockModifyCoverageReport}>
    </CoverageButton>
  )

  component.find('button').simulate('click')
  expect(mockModifyCoverageReport.calledOnceWithExactly(100)).toBeTruthy()
})
