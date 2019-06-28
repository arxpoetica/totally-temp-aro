import Actions from '../../common/actions'
import CoverageActions from '../coverage/coverage-actions'
import SelectionActions from '../selection/selection-actions'
import RfpActions from '../optimization/rfp/rfp-actions'
import socketManager from '../../../react/common/socket-manager'
import RingEditActions from '../ring-edit/ring-edit-actions'
import AroHttp from '../../common/aro-http';

// Set the currently active plan
function setActivePlan (plan) {
  return (dispatch, getState) => {
    getState().plan.activePlan && getState().plan.activePlan.id &&
      socketManager.leavePlanRoom(getState().plan.activePlan.id) // leave previous plan

    dispatch({
      type: Actions.PLAN_SET_ACTIVE_PLAN,
      payload: {
        plan: plan
      }
    })

    socketManager.joinPlanRoom(plan.id) // Join new plan

    // Update details on the coverage report
    dispatch(CoverageActions.updateCoverageStatus(plan.id))
    // Clear plan target selection
    dispatch(SelectionActions.loadPlanTargetSelectionsFromServer(plan.id))
    // Clear RFP state
    dispatch(RfpActions.clearRfpState())
    // load rings
    dispatch(RingEditActions.loadRings(plan.id))
  }
}

function setActivePlanState (planState) {
  return {
    type: Actions.PLAN_SET_ACTIVE_PLAN_STATE,
    payload: planState
  }
}

// Loads a plan with the specified plan id from the server, then sets it as the active plan
function loadPlan (planId, userId) {
  return dispatch => {
    AroHttp.get(`/service/v1/plan/${planId}?user_id=${userId}`)
      .then(result => dispatch(setActivePlan(result.data)))
      .catch(err => console.error(err))
  }
}

export default {
  setActivePlan,
  setActivePlanState,
  loadPlan
}
