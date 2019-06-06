import Actions from '../../common/actions'
import CoverageActions from '../coverage/coverage-actions'
import SelectionActions from '../selection/selection-actions'
import socketManager from '../../../react/common/socket-manager'
import RingEditActions from '../ring-edit/ring-edit-actions'

// Set the plan
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

export default {
  setActivePlan: setActivePlan,
  setActivePlanState: setActivePlanState
}
