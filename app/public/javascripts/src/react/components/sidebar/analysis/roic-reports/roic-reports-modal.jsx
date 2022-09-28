import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Modal, ModalBody, ModalFooter } from 'reactstrap'
import RoicReportsActions from './roic-reports-actions'
import CommonRoicReports from '../roic-reports/common-roic-reports.jsx'

export class RoicReportsModal extends Component {

  render () {

    const { showRoicReportsModal, planId, planState } = this.props

    return (
      <Modal isOpen={showRoicReportsModal} size="lg" toggle={() => this.props.setShowRoicReportsModal()}>
        <div className=" modal-header">
          <h2 className=" modal-title" id="exampleModalLabel">Financial Details</h2>
          <button aria-label="Close" className=" close" type="button"
            onClick={() => this.props.setShowRoicReportsModal()}
          >
            <span aria-hidden={true}>×</span>
          </button>
        </div>
        <ModalBody style={{height: '500px'}}>
          <CommonRoicReports
            planId={planId}
            rOptimizationState={planState}
            reportSize="large"
            key="modal"
          />
        </ModalBody>
        <ModalFooter>
          <button type="button" className="btn btn-primary"
            onClick={() => this.props.setShowRoicReportsModal()}
          >
            Close
          </button>
        </ModalFooter>
      </Modal>
    )
  }
}

const mapStateToProps = (state) => ({
  showRoicReportsModal: state.roicReports.showRoicReportsModal,
  planId: state.plan.activePlan.id,
  planState: state.plan.activePlan.planState,
})

const mapDispatchToProps = (dispatch) => ({
  setShowRoicReportsModal: () => dispatch(RoicReportsActions.setShowRoicReportsModal(false)),
})

const RoicReportsModalComponent = connect(mapStateToProps, mapDispatchToProps)(RoicReportsModal)
export default RoicReportsModalComponent
