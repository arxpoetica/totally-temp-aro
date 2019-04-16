/* global test expect jest */
import React from 'react'
import { shallow } from 'enzyme'
import { ReportDefinitionList } from '../report-definition-list'

const reportsState = {
  metaData: [
    { 'id': 1, 'reportType': 'GENERAL', 'name': 'plan_report', 'displayName': 'plan_report', 'media_types': ['kml'] },
    { 'id': 2, 'reportType': 'GENERAL', 'name': 'planned_equipment', 'displayName': 'Planned Equipment Elements', 'media_types': ['csv', 'json', 'xls'] },
    { 'id': 3, 'reportType': 'GENERAL', 'name': 'planned_fibers', 'displayName': 'Planned Fiber Elements', 'media_types': ['csv', 'json', 'xls'] }
  ],
  reportBeingEdited: null
}

// -----------------------------------------------------------------------------
test('Default component render and click edit one report', () => {
  const mockGetReportsMetadata = jest.fn()
  const mockStartEditingReport = jest.fn()
  const component = shallow(
    <ReportDefinitionList reportsMetaData={reportsState.metaData} reportBeingEdited={null}
      getReportsMetadata={mockGetReportsMetadata} startEditingReport={mockStartEditingReport} />
  )
  expect(mockGetReportsMetadata.mock.calls.length).toBe(1)
  expect(component).toMatchSnapshot()

  component.find('#btnEditReport1').simulate('click')
  expect(mockStartEditingReport).toBeCalledWith(1)
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Edit a report', () => {
  const mockGetReportsMetadata = jest.fn()
  const component = shallow(
    <ReportDefinitionList reportsMetaData={reportsState.metaData} reportBeingEdited={reportsState.metaData[1]}
      getReportsMetadata={mockGetReportsMetadata} />
  )
  expect(mockGetReportsMetadata.mock.calls.length).toBe(1)
  expect(component).toMatchSnapshot()
})
