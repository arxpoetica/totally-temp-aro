import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import RfpStatusActions from './actions'

export class RfpReportDownloadCell extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedReportTypeId: this.props.reportDefinitions.length ? this.props.reportDefinitions[0].reportData.id : 0
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
          selectedReport ? selectedReport.reportData.media_types.map(mediaType => {
            // "(new Date()).toISOString().split('T')[0]" will give "YYYY-MM-DD"
            // Note that we are doing (new Date(Date.now())) so that we can have deterministic tests (by replacing the Date.now() function when testing)
            const downloadFileName = `${(new Date(Date.now())).toISOString().split('T')[0]}_${selectedReport.reportData.name}.${mediaType}`
            const downloadUrl = selectedReport.href
              .replace('{planId}', this.props.planId)
              .replace('{mediaType}', mediaType)
              .replace('{userId}', this.props.userId)
            return <button
              key={mediaType}
              className='btn btn-light'
              style={{ whiteSpace: 'nowrap', width: '75px' }}
              onClick={event => this.props.downloadRfpReport(downloadFileName, downloadUrl)}
              disabled={this.props.reportsBeingDownloaded.has(downloadUrl)}
            >
              {
                this.props.reportsBeingDownloaded.has(downloadUrl)
                  ? <i className='fa fa-spinner fa-spin' />
                  : this.renderDownloadButtonContent(mediaType)
              }
            </button>
          }) : ""
        }
      </div>
    </div>
  }

  renderDownloadButtonContent (mediaType) {
    switch (mediaType) {
      case 'csv':
        return <span><i className='fas fa-file-csv' /> {mediaType}</span>

      case 'json':
        return <span><span style={{ fontFamily: 'monospace' }}>{'{}'}</span> {mediaType}</span>

      case 'xls':
      case 'xlsx':
        return <span><i className='fas fa-file-excel' /> {mediaType}</span>

      default:
        return <span><i className='fa fa-download' /> {mediaType}</span>
    }
  }
}

RfpReportDownloadCell.propTypes = {
  reportsBeingDownloaded: PropTypes.instanceOf(Set)
}

const mapStateToProps = state => ({
  reportsBeingDownloaded: state.optimization.rfp.reportsBeingDownloaded
})

const mapDispatchToProps = dispatch => ({
  downloadRfpReport: (filename, reportUrl) => dispatch(RfpStatusActions.downloadRfpReport(filename, reportUrl))
})

const RfpReportDownloadCellComponent = connect(mapStateToProps, mapDispatchToProps)(RfpReportDownloadCell)
export default RfpReportDownloadCellComponent
