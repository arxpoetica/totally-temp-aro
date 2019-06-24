/* global jest test expect */
import React from 'react'
import { shallow } from 'enzyme'
import RfpReportDownloadCell from '../rfp-report-download-cell.jsx'

const PLAN_ID = 42
const reportDefinitions = [
  {
    reportData: {
      id: 13,
      reportType: 'COVERAGE',
      name: 'site_area_coverage',
      displayName: 'Site Coverage',
      media_types: [
        'csv',
        'json',
        'xls'
      ]
    },
    href: '/rfp/{planId}/report/coverage/13.{mediaType}'
  },
  {
    reportData: {
      id: 14,
      reportType: 'RFP',
      name: 'rfp_report',
      displayName: 'RFP Report',
      media_types: [
        'csv',
        'json',
        'xls'
      ]
    },
    href: '/rfp/{planId}/report/general/14.{mediaType}'
  }
]

// -----------------------------------------------------------------------------
test('Default component render', () => {
  // Mock the Date.now() function so that the test is determinstic
  Date.now = jest.fn(() => 1561358770689)
  const component = shallow(
    <RfpReportDownloadCell
      planId={PLAN_ID}
      reportDefinitions={reportDefinitions}
      userId={1}
    />
  )
  expect(component).toMatchSnapshot()
})

// -----------------------------------------------------------------------------
test('When selected report changes', () => {
  // Mock the Date.now() function so that the test is determinstic
  Date.now = jest.fn(() => 1561358770689)
  const component = shallow(
    <RfpReportDownloadCell
      planId={PLAN_ID}
      reportDefinitions={reportDefinitions}
      userId={1}
    />
  )
  expect(component).toMatchSnapshot()
  component.find('#selectRfpReportDefinition').simulate('change', { target: { value: reportDefinitions[1].reportData.id } })
  expect(component).toMatchSnapshot()
})
