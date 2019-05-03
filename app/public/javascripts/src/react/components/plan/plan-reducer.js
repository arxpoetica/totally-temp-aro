import Actions from '../../common/actions'

// Set the superuser flag for the currently logged in user
function setActivePlan (state, plan) {
  return { ...state, activePlan: plan }
}

function setActivePlanState (state, planState) {
  return { ...state,
    activePlan: { ...state.activePlan,
      planState: planState
    }
  }
}

function planReducer (state = { }, action) {
  switch (action.type) {
    case Actions.PLAN_SET_ACTIVE_PLAN:
      return setActivePlan(state, action.payload.plan)

    case Actions.PLAN_SET_ACTIVE_PLAN_STATE:
      return setActivePlanState(state, action.payload)

    default:
      return state
  }
}

export default planReducer
