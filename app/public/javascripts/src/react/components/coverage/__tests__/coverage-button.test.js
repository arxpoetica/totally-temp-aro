import React from 'react'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import { CoverageButton } from '../coverage-button'
import CoverageStatusTypes from '../constants'
import { List } from 'immutable';

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
  const locationLayers = new List([
    { plannerKey: 'small', checked: true },
    { plannerKey: 'medium', checked: false }
  ])
  const boundaryLayers = new List([
    { key: 'analysis_area', name: 'Analysis Area', checked: true },
    { key: 'analysis_area', name: 'Analysis Area 2', checked: false }
  ])
  const mockInitializeCoverageReport = jest.fn()
  const component = shallow(
    <CoverageButton status={CoverageStatusTypes.UNINITIALIZED}
                    userId={5}
                    planId={22}
                    projectId={7}
                    locationLayers={locationLayers}
                    boundaryLayers={boundaryLayers}
                    activeSelectionModeId={'SELECTED_AREAS'}
                    initializationParams={{ generic: 'Init Params'}}
                    initializeCoverageReport={mockInitializeCoverageReport}></CoverageButton>
  )

  component.find('button').simulate('click')
  // We cannot use expect(mockInitializeCoverageReport).toHaveBeenCalledWith() because of the immutable list
  expect(mockInitializeCoverageReport.mock.calls[0][0]).toEqual(5)
  expect(mockInitializeCoverageReport.mock.calls[0][1]).toEqual(22)
  expect(mockInitializeCoverageReport.mock.calls[0][2]).toEqual(7)
  expect(mockInitializeCoverageReport.mock.calls[0][3]).toEqual('SELECTED_AREAS')

  const expectedLocationLayers = locationLayers.filter(item => item.checked).map(item => item.plannerKey)
  expect(mockInitializeCoverageReport.mock.calls[0][4].equals(expectedLocationLayers)).toBeTruthy()

  expect(mockInitializeCoverageReport.mock.calls[0][5].equals(boundaryLayers)).toBeTruthy()
  expect(mockInitializeCoverageReport.mock.calls[0][6]).toEqual({ generic: 'Init Params'})
})

// -----------------------------------------------------------------------------
test('When button is clicked to modify/delete report', () => {
  const mockModifyCoverageReport = jest.fn()
  const component = shallow(
    <CoverageButton status={CoverageStatusTypes.FINISHED}
                    report={{ reportId: 100 }}
                    modifyCoverageReport={mockModifyCoverageReport}>
    </CoverageButton>
  )

  component.find('button').simulate('click')
  expect(mockModifyCoverageReport).toHaveBeenCalledWith(100)
})
