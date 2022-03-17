import { PropTypes } from 'prop-types'
import { formValueSelector } from 'redux-form'
import reduxStore from '../../../redux-store'
import RingActions from './ring-edit-actions.js'
import PlanActions from '../plan/plan-actions'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import socketManager from '../../../react/common/socket-manager'
// import AroHttp from '../../common/aro-http'
import RingStatusTypes from './constants'
import ProgressButton from '../common/progress-button.jsx'
import Constants from '../../common/constants'
const selector = formValueSelector(Constants.RING_OPTIONS_BASIC_FORM)

export class RingButton extends ProgressButton {
  constructor (props) {
    super(props)

    // override
    this.statusTypes = {
      UNINITIALIZED: RingStatusTypes.START_STATE,
      RUNNING: RingStatusTypes.STARTED,
      FINISHED: RingStatusTypes.COMPLETED
    }

    this.unsubscriber = socketManager.subscribe('PROGRESS_MESSAGE_DATA', (progressData) => {
      if (progressData.data.processType === 'ring') {
        this.props.setActivePlanState(progressData.data.optimizationState)
        this.props.setAnalysisProgress(progressData.data.progress)
      }
    })
  }

  runSubNet () {
    var ringIds = []
    for (var key in this.props.rings) {
      ringIds.push('' + this.props.rings[key].id)
    }
    const planId = this.props.planId
    // const userId = this.props.userId
    var locationTypes = []
    this.props.mapLayers.location.forEach(item => {
      if (item.checked) locationTypes.push(item.plannerKey)
    })
    this.props.requestSubNet(planId, ringIds, locationTypes)
  }

  // override
  onRun () {
    this.props.setActivePlanState(RingStatusTypes.STARTED)
    this.runSubNet()
  }

  // override
  onModify () {
    this.props.onModify()
  }

  componentWillUnmount () {
    this.unsubscriber()
  }
}

// --- //

RingButton.propTypes = {
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
    mapLayers: state.mapLayers
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  requestSubNet: (planId, ringIds, locationTypes) => dispatch(RingActions.requestSubNet(planId, ringIds, locationTypes)),
  setActivePlanState: (status) => dispatch(PlanActions.setActivePlanState(status)),
  setAnalysisProgress: (progress) => dispatch(RingActions.setAnalysisProgress(progress))
})

const RingButtonComponent = wrapComponentWithProvider(reduxStore, RingButton, mapStateToProps, mapDispatchToProps)
export default RingButtonComponent
