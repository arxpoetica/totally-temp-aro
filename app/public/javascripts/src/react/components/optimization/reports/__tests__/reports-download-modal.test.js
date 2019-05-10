/* global test expect jest */
import React from 'react'
import { shallow } from 'enzyme'
import { ReportsDownloadModal, ReportsDownloadRow } from '../reports-download-modal'

// -----------------------------------------------------------------------------
test('When modal is hidden', () => {
  const component = shallow(
    <ReportsDownloadModal
      planId={100}
      showReportModal={false}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When modal is shown', () => {
  const component = shallow(
    <ReportsDownloadModal
      planId={100}
      showReportModal
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When modal is initially hidden and then shown', () => {
  const mockLoadReportsMetaData = jest.fn()
  const component = shallow(
    <ReportsDownloadModal
      planId={100}
      showReportModal={false}
      loadReportsMetaData={mockLoadReportsMetaData}
    />
  )
  expect(component).toMatchSnapshot()
  component.setProps({ showReportModal: true })
  expect(mockLoadReportsMetaData).toHaveBeenCalled()
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When reports metadata is null', () => {
  const component = shallow(
    <ReportsDownloadModal
      planId={100}
      reportsMetaData={null}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When reports metadata is defined', () => {
  const reportsMetaData = [
    {
      displayName: 'Optimization Analysis',
      id: 4,
      media_types: ['csv', 'json', 'xls'],
      name: 'optimization_analysis',
      reportType: 'NETWORK_ANALYSIS'
    }
  ]
  const component = shallow(
    <ReportsDownloadModal
      planId={100}
      reportsMetaData={reportsMetaData}
      reportTypes={['NETWORK_ANALYSIS']}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('NetworkAnalysisReportRow render', () => {
  // Mock the Date.now() function so that the test is determinstic
  Date.now = jest.fn(() => 1557383970443)
  const component = shallow(
    <ReportsDownloadRow
      planId={100}
      reportId={287}
      reportName={'optimization_analysis_report'}
      displayName={'Optimization analysis report'}
      mediaTypes={['csv', 'json', 'xls']}
      reportTypes={['NETWORK_ANALYSIS']}
    />
  )
  expect(component).toMatchSnapshot()
})
