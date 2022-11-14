import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Select, Button } from '@mantine/core'
import { IconTable, IconBraces, IconFileSpreadsheet, IconDownload } from '@tabler/icons'
import RfpModalActions from './rfp-modal-actions'

const LeftIcon = ({ mediaType }) => {
  switch (mediaType) {
    case 'csv':
      return <IconTable size={20} stroke={2}/>
    case 'json':
      return <IconBraces size={20} stroke={2}/>
    case 'xls':
    case 'xlsx':
      return <IconFileSpreadsheet size={20} stroke={2}/>
    default:
      return <IconDownload size={20} stroke={2}/>
  }

}

const _RfpReportDownload = props => {

  const {
    planId,
    reportDefinitions,
    userId,
    reportsBeingDownloaded,
    downloadRfpReport,
  } = props

  const [selectedId, setSelectedId] = useState(
    reportDefinitions.length ? reportDefinitions[0].reportData.id : 0
  )

  const selectedReport = reportDefinitions
    .filter(report => report.reportData.id === selectedId)[0]

  return <div className="rfp-report-download">
    <Select
      value={selectedId}
      placeholder="Select Template"
      onChange={value => setSelectedId(+value)}
      data={reportDefinitions.map(({ reportData }) => ({
        value: reportData.id,
        label: reportData.displayName,
      }))}
    />
    <Button.Group>
      {selectedReport && selectedReport.reportData.media_types.map(mediaType => {

        const yyyyMmDd = (new Date(Date.now())).toISOString().split('T')[0]
        const filename = `${yyyyMmDd}_${selectedReport.reportData.name}.${mediaType}`
        const url = selectedReport.href
          .replace('{planId}', planId)
          .replace('{mediaType}', mediaType)
          .replace('{userId}', userId)
        const loading = reportsBeingDownloaded.has(url)

        return <Button
          key={mediaType}
          leftIcon={<LeftIcon mediaType={mediaType}/>}
          variant="outline"
          onClick={() => downloadRfpReport(filename, url)}
          disabled={loading}
          loading={loading}
        >
          {mediaType}
        </Button>

      })}
    </Button.Group>

    <style jsx>{`
      .rfp-report-download {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
      }
    `}</style>
  </div>

}

const mapStateToProps = state => ({
  userId: state.user.loggedInUser && state.user.loggedInUser.id,
  reportsBeingDownloaded: state.optimization.rfp.reportsBeingDownloaded,
})

const mapDispatchToProps = dispatch => ({
  downloadRfpReport: (filename, reportUrl) => dispatch(RfpModalActions.downloadRfpReport(filename, reportUrl))
})

export const RfpReportDownload = connect(mapStateToProps, mapDispatchToProps)(_RfpReportDownload)
