import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import { formValueSelector } from 'redux-form'
import RfpActions from './rfp-actions'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpStatusTypes from './constants'
import uuidv4 from 'uuid/v4'
import Constants from '../../../common/constants'
const selector = formValueSelector(Constants.RFP_OPTIONS_FORM)

export class RfpButton extends Component {
  render () {
    switch (this.props.status) {
      case RfpStatusTypes.UNINITIALIZED:
        return this.renderUninitializedButton()

      case RfpStatusTypes.RUNNING:
        return this.renderProgressbar()

      case RfpStatusTypes.FINISHED:
        return this.renderFinishedButton()

      default:
        return <div>ERROR: Unknown coverage status - {this.props.status}</div>
    }
  }

  renderUninitializedButton () {
    return (
      <button className={'btn btn-block btn-primary'} style={{ marginBottom: '10px' }}
        onClick={() => this.props.initializeRfpReport(this.props.planId, this.props.userId, this.props.projectId, uuidv4(), this.props.fiberRoutingMode, this.props.targets)}>
        <i className='fa fa-bolt' /> Run
      </button>
    )
  }

  renderProgressbar () {
    return <div className={'progress'} style={{ height: '34px', position: 'relative', marginBottom: '10px' }}>
      <div className={'progress-bar progress-bar-optimization'} role='progressbar' aria-valuenow={this.props.progress}
        aria-valuemin='0' aria-valuemax='1' style={{ lineHeight: '34px', width: (this.props.progress * 100) + '%' }} />
      <div style={{ position: 'absolute',
        top: '50%',
        left: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        color: 'white',
        transform: 'translateX(-50%) translateY(-50%)',
        width: '80px',
        textAlign: 'center',
        borderRadius: '3px',
        fontWeight: 'bold' }}>
        Running RFP
      </div>
    </div>
  }

  renderFinishedButton () {
    return (
      <button className={'btn btn-block modify-coverage-button'} style={{ marginBottom: '10px' }}
        onClick={() => this.props.modifyRfpReport()}>
        <i className='fa fa-edit' /> Modify
      </button>
    )
  }
}

RfpButton.propTypes = {
  status: PropTypes.string,
  targets: PropTypes.array,
  projectId: PropTypes.number,
  userId: PropTypes.number,
  planId: PropTypes.number,
  fiberRoutingMode: PropTypes.string
}

const mapStateToProps = (state) => {
  return {
    status: state.optimization.rfp.status,
    targets: state.optimization.rfp.targets,
    projectId: state.user.loggedInUser.projectId,
    userId: state.user.loggedInUser.id,
    planId: state.plan.activePlan.id,
    fiberRoutingMode: selector(state, 'fiberRoutingMode.value')
  }
}

const mapDispatchToProps = dispatch => ({
  modifyRfpReport: () => dispatch(RfpActions.modifyRfpReport()),
  initializeRfpReport: (planId, userId, projectId, rfpId, fiberRoutingMode, targets) => dispatch(RfpActions.initializeRfpReport(planId, userId, projectId, rfpId, fiberRoutingMode, targets))
})

const CoverageButtonComponent = wrapComponentWithProvider(reduxStore, RfpButton, mapStateToProps, mapDispatchToProps)
export default CoverageButtonComponent
