import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import { formValueSelector } from 'redux-form'
import RfpActions from './rfp-actions'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpStatusTypes from './constants'
import uuidv4 from 'uuid/v4'
import Constants from '../../../common/constants'
import socketManager from '../../../../react/common/socket-manager'
import ProgressButton from '../../common/progress-button.jsx'
const selector = formValueSelector(Constants.RFP_OPTIONS_FORM)

export class RfpButton extends ProgressButton {
  constructor (props) {
    super(props)

    // override
    this.statusTypes = {
      UNINITIALIZED: RfpStatusTypes.UNINITIALIZED,
      RUNNING: RfpStatusTypes.RUNNING,
      FINISHED: RfpStatusTypes.FINISHED
    }

    this.unsubscriber = socketManager.subscribe('PROGRESS_MESSAGE_DATA', (progressData) => {
      if (progressData.data.processType === 'rfp') {
        this.props.setOptimizationProgress(progressData.data)
      }
    })
  }

  // override
  onRun () {
    this.props.initializeRfpReport(this.props.planId, this.props.userId, this.props.projectId, uuidv4(), this.props.fiberRoutingMode, this.props.targets)
  }

  // override
  onModify () {
    this.props.modifyRfpReport()
  }

  componentWillUnmount () {
    this.unsubscriber()
  }
}

RfpButton.propTypes = {
  status: PropTypes.string,
  targets: PropTypes.array,
  projectId: PropTypes.number,
  progress: PropTypes.number,
  userId: PropTypes.number,
  planId: PropTypes.number,
  fiberRoutingMode: PropTypes.string
}

const mapStateToProps = (state) => {
  return {
    status: state.optimization.rfp.status,
    targets: state.optimization.rfp.targets,
    projectId: state.user.loggedInUser.projectId,
    progress: state.optimization.rfp.progress,
    userId: state.user.loggedInUser.id,
    planId: state.plan.activePlan.id,
    fiberRoutingMode: selector(state, 'fiberRoutingMode.value')
  }
}

const mapDispatchToProps = dispatch => ({
  modifyRfpReport: () => dispatch(RfpActions.modifyRfpReport()),
  initializeRfpReport: (planId, userId, projectId, rfpId, fiberRoutingMode, targets) => dispatch(RfpActions.initializeRfpReport(planId, userId, projectId, rfpId, fiberRoutingMode, targets)),
  setOptimizationProgress: (progress) => dispatch(RfpActions.setOptimizationProgress(progress))
})

const CoverageButtonComponent = wrapComponentWithProvider(reduxStore, RfpButton, mapStateToProps, mapDispatchToProps)
export default CoverageButtonComponent
