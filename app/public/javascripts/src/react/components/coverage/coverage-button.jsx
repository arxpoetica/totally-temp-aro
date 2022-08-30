import React from 'react'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import CoverageActions from '../coverage/coverage-actions'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import CoverageStatusTypes from './constants'
import { SocketManager } from '../../../react/common/socket-manager'
import ProgressButton from '../common/progress-button.jsx'

export class CoverageButton extends ProgressButton {
  constructor (props) {
    super(props)

    // override 
    this.statusTypes = {
      UNINITIALIZED: CoverageStatusTypes.UNINITIALIZED,
      RUNNING: CoverageStatusTypes.RUNNING,
      FINISHED: CoverageStatusTypes.FINISHED
    }

    this.unsubscriber = SocketManager.subscribe('PROGRESS_MESSAGE_DATA', (progressData) => {
      if (progressData.data.processType === 'coverage') {
        this.props.setCoverageProgress(progressData.data)
      }
    })
  }

  renderFinishedButton () {
    return (
      <button className={'btn btn-block modify-coverage-button'} style={{ marginBottom: '10px' }}
        onClick={() => this.props.modifyCoverageReport(this.props.report.reportId)}>
        <i className='fa fa-edit' /> Modify
      </button>
    )
  }

  // override 
  onRun () {
    this.props.initializeCoverageReport(this.props.userId, this.props.planId, this.props.projectId, this.props.activeSelectionModeId,
      this.props.locationLayers.filter(item => item.checked).map(item => item.plannerKey),
      this.props.boundaryLayers, this.props.initializationParams)
  } 
  
  // override 
  onModify () {
    this.props.modifyCoverageReport(this.props.report.reportId)
  }

  componentWillUnmount () {
    this.unsubscriber()
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
  },
  setCoverageProgress: (progress) => dispatch(CoverageActions.setCoverageProgress(progress))
})

const CoverageButtonComponent = wrapComponentWithProvider(reduxStore, CoverageButton, mapStateToProps, mapDispatchToProps)
export default CoverageButtonComponent
