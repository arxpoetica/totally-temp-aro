import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import NetworkAnalysisActions from './network-analysis-actions'

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
            <button
              type='button'
              onClick={() => this.props.showOrHideReportModal(false)}
              className='close'
            >
              &times;
            </button>
            <h4 className='modal-title'>Modal Header</h4>
          </div>
          <div className='modal-body'>
            <p>Some text in the modal.</p>
          </div>
          <div className='modal-footer'>
            <button
              onClick={() => this.props.showOrHideReportModal(false)}
              type='button'
              className='btn btn-default'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  }
}

NetworkAnalysisReportModal.propTypes = {
  showReportModal: PropTypes.bool
}

const mapStateToProps = (state) => ({
  showReportModal: state.optimization.networkAnalysis.showReportModal
})

const mapDispatchToProps = dispatch => ({
  showOrHideReportModal: showReportModal => dispatch(NetworkAnalysisActions.showOrHideReportModal(showReportModal))
})

const NetworkAnalysisReportModalComponent = wrapComponentWithProvider(reduxStore, NetworkAnalysisReportModal, mapStateToProps, mapDispatchToProps)
export default NetworkAnalysisReportModalComponent
