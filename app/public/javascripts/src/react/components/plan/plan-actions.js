import Actions from '../../common/actions'

// Set the plan
function setPlan(plan) {
  return {
    type: Actions.SET_PLAN,
    payload: {
      plan: plan
    }
  }
}

export default {
  setPlan: setPlan
}