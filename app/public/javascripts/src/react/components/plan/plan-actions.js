import Actions from '../../common/actions'
import CoverageActions from '../coverage/coverage-actions'

// Set the plan
function setPlan (plan) {
  return dispatch => {
    dispatch({
      type: Actions.PLAN_SET_PLAN,
      payload: {
        plan: plan
      }
    })
    // Update details on the coverage report
    dispatch(CoverageActions.updateCoverageStatus(plan.id))
  }
}

export default {
  setPlan: setPlan
}
