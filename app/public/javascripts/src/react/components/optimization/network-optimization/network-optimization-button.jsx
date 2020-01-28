import { PropTypes } from 'prop-types'
import { formValueSelector } from 'redux-form'
import reduxStore from '../../../../redux-store'
import RingActions from '../../ring-edit/ring-edit-actions'
import PlanActions from '../../plan/plan-actions'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import socketManager from '../../../../react/common/socket-manager'
// import AroHttp from '../../common/aro-http'
// import RingStatusTypes from './constants'
import AngConstants from '../../../../components/common/constants' // ToDo: merge constants, put in Redux?
import ProgressButton from '../../common/progress-button.jsx'
import Constants from '../../../common/constants'
const selector = formValueSelector(Constants.RING_OPTIONS_BASIC_FORM)

export class NetworkOptimizationButton extends ProgressButton {
  constructor (props) {
    super(props)
    // override
    this.statusTypes = {
      UNINITIALIZED: AngConstants.PLAN_STATE.START_STATE,
      RUNNING: AngConstants.PLAN_STATE.STARTED,
      FINISHED: AngConstants.PLAN_STATE.COMPLETED
    }

    this.unsubscriber = socketManager.subscribe('PROGRESS_MESSAGE_DATA', (progressData) => {
      if (progressData.data.processType === 'optimization') {
        this.props.setActivePlanState(progressData.data.optimizationState)
        this.props.setAnalysisProgress(progressData.data.progress)
      }
    })
  }

  // override
  onRun () {
    // this.runOptimization()
    this.props.onRun()
  }

  // override
  onModify () {
    this.props.onModify()
  }

  // override
  onCancel () {
    this.props.onCancel()
  }

  componentWillUnmount () {
    this.unsubscriber()
  }
}

// --- //

NetworkOptimizationButton.propTypes = {
  status: PropTypes.string,
  progress: PropTypes.number,
  userId: PropTypes.number,
  planId: PropTypes.number,
  projectId: PropTypes.number,
  onModify: PropTypes.func
}

const mapStateToProps = state => {
  return {
    // status: state.ringEdit.analysis.status,
    status: state.plan.activePlan && state.plan.activePlan.planState,
    progress: state.ringEdit.analysis.progress,
    userId: state.user.loggedInUser.id,
    planId: state.plan.activePlan && state.plan.activePlan.id,
    projectId: state.user.loggedInUser.projectId,
    rings: state.ringEdit.rings,
    ringOptionsBasic: selector(state, 'spatialEdgeType', 'snappingDistance', 'maxConnectionDistance', 'maxWormholeDistance', 'ringComplexityCount', 'maxLocationEdgeDistance', 'locationBufferSize', 'conduitBufferSize', 'targetEdgeTypes'),
    connectivityDefinition: state.ringEdit.connectivityDefinition,
    mapLayers: state.mapLayers
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  requestSubNet: (planId, ringIds, locationTypes, ringOptions, connectivityDefinition) => dispatch(RingActions.requestSubNet(planId, ringIds, locationTypes, ringOptions, connectivityDefinition)),
  setActivePlanState: (status) => dispatch(PlanActions.setActivePlanState(status)),
  setAnalysisProgress: (progress) => dispatch(RingActions.setAnalysisProgress(progress))
})

const NetworkOptimizationButtonComponent = wrapComponentWithProvider(reduxStore, NetworkOptimizationButton, mapStateToProps, mapDispatchToProps)
export default NetworkOptimizationButtonComponent
