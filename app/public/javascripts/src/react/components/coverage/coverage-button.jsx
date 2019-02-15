import React, { Component } from 'react'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import CoverageActions from '../coverage/coverage-actions'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import CoverageStatusTypes from './constants'

export class CoverageButton extends Component {
  render () {
    switch (this.props.status) {
      case CoverageStatusTypes.UNINITIALIZED:
        return this.renderUninitializedButton()

      case CoverageStatusTypes.RUNNING:
        return this.renderProgressbar()

      case CoverageStatusTypes.FINISHED:
        return this.renderFinishedButton()

      default:
        return <div>ERROR: Unknown coverage status - {this.props.status}</div>
    }
  }

  renderUninitializedButton () {
    return (
      <button className={'btn btn-block btn-primary'} style={{ marginBottom: '10px' }}
        onClick={() => this.props.initializeCoverageReport(this.props.userId, this.props.planId, this.props.projectId, this.props.activeSelectionModeId,
          this.props.locationLayers.filter(item => item.checked).map(item => item.plannerKey),
          this.props.boundaryLayers, this.props.initializationParams)}>
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
        {Math.round(this.props.progress * 100) + '%'}
      </div>
    </div>
  }

  renderFinishedButton () {
    return (
      <button className={'btn btn-block modify-coverage-button'} style={{ marginBottom: '10px' }}
        onClick={() => this.props.modifyCoverageReport(this.props.report.reportId)}>
        <i className='fa fa-edit' /> Modify
      </button>
    )
  }
}

CoverageButton.propTypes = {
  status: PropTypes.string,
  progress: PropTypes.number,
  userId: PropTypes.number,
  planId: PropTypes.number,
  projectId: PropTypes.number,
  locationLayers: ImmutablePropTypes.list,
  boundaryLayers: ImmutablePropTypes.list,
  activeSelectionModeId: PropTypes.string,
  initializationParams: PropTypes.object,
  report: PropTypes.object
}

const mapStateToProps = (state) => {
  return {
    status: state.coverage.status,
    progress: state.coverage.progress,
    userId: state.user.loggedInUser.id,
    planId: state.plan.activePlan && state.plan.activePlan.id,
    projectId: state.user.loggedInUser.projectId,
    locationLayers: state.mapLayers.location,
    boundaryLayers: state.mapLayers.boundary,
    activeSelectionModeId: state.selection.activeSelectionMode.id,
    initializationParams: state.coverage.initializationParams,
    report: state.coverage.report
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  modifyCoverageReport: (reportId) => dispatch(CoverageActions.modifyCoverageReport(reportId)),
  initializeCoverageReport: (userId, planId, projectId, activeSelectionMode, locationTypes, boundaryLayers, initializationParams) => {
    dispatch(CoverageActions.initializeCoverageReport(userId, planId, projectId, activeSelectionMode, locationTypes,
      boundaryLayers, initializationParams))
  }
})

const CoverageButtonComponent = wrapComponentWithProvider(reduxStore, CoverageButton, mapStateToProps, mapDispatchToProps)
export default CoverageButtonComponent
