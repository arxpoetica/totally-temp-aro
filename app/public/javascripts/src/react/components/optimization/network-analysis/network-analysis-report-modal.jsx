import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import NetworkAnalysisActions from './network-analysis-actions'

// An internal class for rendering a single row in the reports table
class NetworkAnalysisReportRow extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedFormat: this.props.mediaTypes[0]
    }
  }

  render () {
    // "(new Date()).toISOString().split('T')[0]" will give "YYYY-MM-DD"
    const downloadFileName = `${(new Date()).toISOString().split('T')[0]}_${this.props.reportName}.${this.state.selectedFormat}`
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
        <a className='btn btn-sm btn-light'
          href={`/service-download-file/${downloadFileName}/v2/report-extended/${this.props.reportId}/${this.props.planId}.${this.state.selectedFormat}`}
          download>
          <i className='fa fa-download' /> Download
        </a>
      </td>
    </tr>
  }
}
NetworkAnalysisReportRow.propTypes = {
  planId: PropTypes.number,
  reportId: PropTypes.number,
  reportName: PropTypes.string,
  displayName: PropTypes.string,
  mediaTypes: PropTypes.array
}

export class NetworkAnalysisReportModal extends Component {
  render () {
    return <div
      id='modalNetworkAnalysisReports'
      className={`modal fade ${this.props.showReportModal ? 'show' : ''}`}
      role='dialog'
      style={{ display: this.props.showReportModal ? 'block' : 'none' }}
    >
      <div className='modal-dialog'>
        <div className='modal-content'>
          <div className='modal-header'>
            <h4 className='modal-title'>Network Analysis Reports</h4>
            <button
              type='button'
              onClick={() => this.props.showOrHideReportModal(false)}
              className='close'
            >
              &times;
            </button>
          </div>
          <div className='modal-body'>
            <table className='table table-sm table-striped'>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Format</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {
                  (this.props.reportsMetaData || []).map((report, index) => (
                    <NetworkAnalysisReportRow
                      key={index}
                      reportId={report.id}
                      reportName={report.name}
                      displayName={report.displayName}
                      mediaTypes={report.media_types}
                      planId={this.props.planId} />
                  ))
                }
              </tbody>
            </table>
          </div>
          <div className='modal-footer'>
            <button
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

NetworkAnalysisReportModal.propTypes = {
  planId: PropTypes.number,
  reportsMetaData: PropTypes.array,
  showReportModal: PropTypes.bool
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  reportsMetaData: state.optimization.networkAnalysis.reportsMetaData,
  showReportModal: state.optimization.networkAnalysis.showReportModal
})

const mapDispatchToProps = dispatch => ({
  loadReportsMetaData: () => dispatch(NetworkAnalysisActions.loadReportsMetaData()),
  showOrHideReportModal: showReportModal => dispatch(NetworkAnalysisActions.showOrHideReportModal(showReportModal))
})

const NetworkAnalysisReportModalComponent = wrapComponentWithProvider(reduxStore, NetworkAnalysisReportModal, mapStateToProps, mapDispatchToProps)
export default NetworkAnalysisReportModalComponent
