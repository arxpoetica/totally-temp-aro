import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import ReportsActions from './reports-actions'
import '../../common-styles/modal.css'

// An internal class for rendering a single row in the reports table
export class ReportsDownloadRow extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedFormat: this.props.mediaTypes[0]
    }
  }

  render () {
    // "(new Date()).toISOString().split('T')[0]" will give "YYYY-MM-DD"
    // Note that we are doing (new Date(Date.now())) so that we can have deterministic tests (by replacing the Date.now() function when testing)
    const downloadFileName = `${(new Date(Date.now())).toISOString().split('T')[0]}_${this.props.reportName}.${this.state.selectedFormat}`
    return <tr>
      <td>{this.props.displayName}</td>
      <td>
        <select
          className='form-control form-control-sm'
          value={this.state.selectedFormat}
          onChange={event => this.setState({ selectedFormat: event.target.value })}>
          { this.props.mediaTypes.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </td>
      <td style={{ textAlign: 'center' }}>
        <a className={this.props.isDownloading ? 'btn btn-sm btn-light disabled' : 'btn btn-sm btn-primary'}
          href={`/service-download-file/${downloadFileName}/v2/report-extended/${this.props.reportId}/${this.props.planId}.${this.state.selectedFormat}`}
          onClick={event => this.props.setIsDownloadingReport()}
          download>
          {
            this.props.isDownloading
              ? <span><i className='fa fa-spinner fa-spin' /> Downloading...</span>
              : <span><i className='fa fa-download' /> Download</span>
          }
        </a>
      </td>
    </tr>
  }
}

ReportsDownloadRow.propTypes = {
  planId: PropTypes.number,
  reportId: PropTypes.number,
  reportName: PropTypes.string,
  displayName: PropTypes.string,
  mediaTypes: PropTypes.array,
  isDownloading: PropTypes.bool,
  title: PropTypes.string,
  setIsDownloadingReport: PropTypes.func
}

export class ReportsDownloadModal extends Component {
  render () {
    const reportTypes = (this.props.reportTypes || [])
    const visibleReports = (this.props.reportsMetaData || []).filter(report => reportTypes.indexOf(report.reportType) >= 0)
    return <div
      id='modalNetworkAnalysisReports'
      className={`modal fade ${this.props.showReportModal ? 'show' : ''}`}
      role='dialog'
      style={{ display: this.props.showReportModal ? 'block' : 'none' }}
    >
      <div className='modal-dialog'>
        <div className='modal-content'>
          <div className='modal-header'>
            <h4 className='modal-title'>{this.props.title}</h4>
            <button
              id='btnHeaderHideReportModal'
              type='button'
              onClick={() => this.props.showOrHideReportModal(false)}
              className='close'
            >
              &times;
            </button>
          </div>
          <div className='modal-body aro-modal-body'>
            <table className='table table-sm table-striped'>
              <thead>
                <tr>
                  <th>Report</th>
                  <th style={{ minWidth: '70px' }}>Format</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {
                  visibleReports.map((report, index) => (
                    <ReportsDownloadRow
                      key={index}
                      reportId={report.id}
                      reportName={report.name}
                      displayName={report.displayName}
                      mediaTypes={report.media_types}
                      isDownloading={report.isDownloading}
                      planId={this.props.planId}
                      setIsDownloadingReport={() => this.props.setIsDownloadingReport(index)}
                    />
                  ))
                }
              </tbody>
            </table>
          </div>
          <div className='modal-footer'>
            <button
              id='btnHideReportModal'
              onClick={() => this.props.showOrHideReportModal(false)}
              type='button'
              className='btn btn-light'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  componentWillReceiveProps (nextProps) {
    // If the modal dialog is going from hidden to visible state, load reports metadata
    if (!this.props.showReportModal && nextProps.showReportModal) {
      this.props.loadReportsMetaData()
    }
  }
}

ReportsDownloadModal.propTypes = {
  planId: PropTypes.number,
  reportsMetaData: PropTypes.array,
  reportTypes: PropTypes.array,
  showReportModal: PropTypes.bool
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  reportsMetaData: state.optimization.report.reportsMetaData,
  showReportModal: state.optimization.report.showReportModal
})

const mapDispatchToProps = dispatch => ({
  loadReportsMetaData: () => dispatch(ReportsActions.loadReportsMetaData()),
  setIsDownloadingReport: index => dispatch(ReportsActions.setIsDownloadingReport(index, true)),
  showOrHideReportModal: showReportModal => dispatch(ReportsActions.showOrHideReportModal(showReportModal))
})

const ReportsDownloadModalComponent = wrapComponentWithProvider(reduxStore, ReportsDownloadModal, mapStateToProps, mapDispatchToProps)
export default ReportsDownloadModalComponent
