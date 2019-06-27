import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import ReportDefinitionPropType from './report-definition-prop-type'

export default class RfpReportDownloadCell extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedReportTypeId: this.props.reportDefinitions[0].reportData.id
    }
  }

  render () {
    const selectedReport = this.props.reportDefinitions.filter(report => report.reportData.id === this.state.selectedReportTypeId)[0]
    return <div className='d-flex'>
      <select
        id='selectRfpReportDefinition'
        className='form-control'
        style={{ marginTop: '1px' }}
        value={this.state.selectedReportTypeId}
        onChange={event => this.setState({ selectedReportTypeId: +event.target.value })}>
        {this.props.reportDefinitions.map(reportDefinition => (
          <option
            key={reportDefinition.reportData.id}
            value={reportDefinition.reportData.id}>
            {reportDefinition.reportData.displayName}
          </option>
        ))}
      </select>
      <div className='btn btn-group p-0'>
        {
          selectedReport.reportData.media_types.map(mediaType => {
            // "(new Date()).toISOString().split('T')[0]" will give "YYYY-MM-DD"
            // Note that we are doing (new Date(Date.now())) so that we can have deterministic tests (by replacing the Date.now() function when testing)
            const downloadFileName = `${(new Date(Date.now())).toISOString().split('T')[0]}_${selectedReport.reportData.name}.${mediaType}`
            const downloadUrl = selectedReport.href
              .replace('{planId}', this.props.planId)
              .replace('{mediaType}', mediaType)
              .replace('{userId}', this.props.userId)
              .replace('{projectId}', this.props.projectId)
            return <a
              key={mediaType}
              className='btn btn-light'
              style={{ whiteSpace: 'nowrap' }}
              href={`/service-download-file/${downloadFileName}${downloadUrl}`}
              download>
              {this.renderDownloadIcon(mediaType)} {mediaType}
            </a>
          })
        }
      </div>
    </div>
  }

  renderDownloadIcon (mediaType) {
    switch (mediaType) {
      case 'csv':
        return <i className='fas fa-file-csv' />

      case 'json':
        return <span style={{ fontFamily: 'monospace' }}>{'{}'}</span>

      case 'xls':
      case 'xlsx':
        return <i className='fas fa-file-excel' />

      default:
        return <i className='fa fa-download' />
    }
  }
}

RfpReportDownloadCell.propTypes = {
  planId: PropTypes.number,
  reportDefinitions: ReportDefinitionPropType,
  userId: PropTypes.number,
  projectId: PropTypes.number
}
