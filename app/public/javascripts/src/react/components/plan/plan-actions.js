import Actions from '../../common/actions'
import CoverageActions from '../coverage/coverage-actions'
import SelectionActions from '../selection/selection-actions'

// Set the plan
function setActivePlan (plan) {
  return dispatch => {
    dispatch({
      type: Actions.PLAN_SET_ACTIVE_PLAN,
      payload: {
        plan: plan
      }
    })
    // Update details on the coverage report
    dispatch(CoverageActions.updateCoverageStatus(plan.id))
    // Clear plan target selection
    dispatch(SelectionActions.loadPlanTargetSelectionsFromServer(plan.id))
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
