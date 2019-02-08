import Actions from '../../common/actions'

// Set the superuser flag for the currently logged in user
function setPlan(state, plan) {
  return { ...state, activePlan: plan }
}

function planReducer(state = { }, action) {
  switch(action.type) {
    case Actions.SET_PLAN:
      return setPlan(state, action.payload.plan)

    default:
      return state
  }
}

export default planReducer