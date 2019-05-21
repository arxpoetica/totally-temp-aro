import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpActions from './rfp-actions'
import '../../common-styles/modal.css'

// An internal class for rendering a single row in the reports table
export class RfpStatusRow extends Component {
  render () {
    // "(new Date()).toISOString().split('T')[0]" will give "YYYY-MM-DD"
    // Note that we are doing (new Date(Date.now())) so that we can have deterministic tests (by replacing the Date.now() function when testing)
    // const downloadFileName = `${(new Date(Date.now())).toISOString().split('T')[0]}_`
    return <tr>
      <td>{this.props.name}</td>
      <td>{this.props.startTime.toISOString()}</td>
      <td>{this.props.status}</td>
      <td>
        <button className='btn btn-sm btn-light'>Build</button>
        <button className='btn btn-sm btn-light'>Coverage</button>
        <button className='btn btn-sm btn-light'>KML</button>
      </td>
    </tr>
  }
}

RfpStatusRow.propTypes = {
  name: PropTypes.string,
  startTime: PropTypes.instanceOf(Date),
  status: PropTypes.string
}

export class RfpStatusModal extends Component {
  render () {
    const rfps = [
      { name: 'Rfp 1.0', startTime: new Date(), status: 'FINISHED' },
      { name: 'Rfp 2.0', startTime: new Date(), status: 'RUNNING' }
    ]
    return <div
      id='modalRfpStatus'
      className={`modal fade ${this.props.showRfpStatusModal ? 'show' : ''}`}
      role='dialog'
      style={{ display: this.props.showRfpStatusModal ? 'block' : 'none' }}
    >
      <div className='modal-dialog'>
        <div className='modal-content'>
          <div className='modal-header'>
            <h4 className='modal-title'>RFP Status</h4>
            <button
              id='btnHeaderHideRfpStatusModal'
              type='button'
              onClick={() => this.props.showOrHideRfpStatusModal(false)}
              className='close'
            >
              &times;
            </button>
          </div>
          <div className='modal-body'>
            <table className='table table-sm table-striped'>
              <thead className='thead thead-dark'>
                <tr>
                  <th>Name</th>
                  <th>Start time</th>
                  <th>Status</th>
                  <th>Download reports</th>
                </tr>
              </thead>
              <tbody>
                {
                  rfps.map((rfp, index) => (
                    <RfpStatusRow
                      key={index}
                      name={rfp.name}
                      startTime={rfp.startTime}
                      status={rfp.status}
                    />
                  ))
                }
              </tbody>
            </table>
          </div>
          <div className='modal-footer'>
            <button
              id='btnHideRfpStatusModal'
              onClick={() => this.props.showOrHideRfpStatusModal(false)}
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
}

RfpStatusModal.propTypes = {
  showRfpStatusModal: PropTypes.bool
}

const mapStateToProps = state => ({
  showRfpStatusModal: state.optimization.rfp.showRfpStatusModal
})

const mapDispatchToProps = dispatch => ({
  showOrHideRfpStatusModal: show => dispatch(RfpActions.showOrHideRfpStatusModal(show))
})

const RfpStatusModalComponent = wrapComponentWithProvider(reduxStore, RfpStatusModal, mapStateToProps, mapDispatchToProps)
export default RfpStatusModalComponent
