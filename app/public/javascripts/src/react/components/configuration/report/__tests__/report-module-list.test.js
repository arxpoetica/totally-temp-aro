/* global test expect jest */
import React from 'react'
import { shallow } from 'enzyme'
import { ReportModuleList } from '../report-module-list'

const reportsState = {
  metaData: [
    { 'id': 1, 'reportType': 'GENERAL', 'name': 'plan_report', 'displayName': 'plan_report', 'media_types': ['kml'] },
    { 'id': 2, 'reportType': 'GENERAL', 'name': 'planned_equipment', 'displayName': 'Planned Equipment Elements', 'media_types': ['csv', 'json', 'xls'] },
    { 'id': 3, 'reportType': 'GENERAL', 'name': 'planned_fibers', 'displayName': 'Planned Fiber Elements', 'media_types': ['csv', 'json', 'xls'] }
  ],
  reportBeingEdited: null
}

// -----------------------------------------------------------------------------
test('Click edit report', () => {
  const mockGetReportsMetadata = jest.fn()
  const mockStartEditingReport = jest.fn()
  const component = shallow(
    <ReportModuleList reportsMetaData={reportsState.metaData} reportBeingEdited={null}
      getReportsMetadata={mockGetReportsMetadata} startEditingReport={mockStartEditingReport} />
  )
  expect(mockGetReportsMetadata.mock.calls.length).toBe(1)
  expect(component).toMatchSnapshot()

  component.find('#btnEditReport1').simulate('click')
  expect(mockStartEditingReport).toBeCalledWith(1)
})

// -----------------------------------------------------------------------------
test('Click create report', () => {
  const mockGetReportsMetadata = jest.fn()
  const mockCreateReport = jest.fn()
  const component = shallow(
    <ReportModuleList reportsMetaData={reportsState.metaData} reportBeingEdited={null}
      getReportsMetadata={mockGetReportsMetadata} createReport={mockCreateReport} />
  )
  expect(mockGetReportsMetadata.mock.calls.length).toBe(1)
  expect(component).toMatchSnapshot()

  component.find('#btnCreateNewReport').simulate('click')
  expect(mockCreateReport.mock.calls.length).toBe(1)
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Click delete report', () => {
  const mockGetReportsMetadata = jest.fn()
  const mockDeleteReport = jest.fn()
  const component = shallow(
    <ReportModuleList reportsMetaData={reportsState.metaData} reportBeingEdited={null}
      getReportsMetadata={mockGetReportsMetadata} deleteReport={mockDeleteReport} />
  )
  expect(mockGetReportsMetadata.mock.calls.length).toBe(1)
  expect(component).toMatchSnapshot()

  component.find('#btnDeleteReport1').simulate('click')
  expect(mockDeleteReport).toBeCalledWith(1)
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('Is editing report', () => {
  const mockGetReportsMetadata = jest.fn()
  const component = shallow(
    <ReportModuleList reportsMetaData={reportsState.metaData} reportBeingEdited={reportsState.metaData[1]}
      getReportsMetadata={mockGetReportsMetadata} />
  )
  expect(mockGetReportsMetadata.mock.calls.length).toBe(1)
  expect(component).toMatchSnapshot()
})
