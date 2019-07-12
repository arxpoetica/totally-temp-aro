import Actions from '../../common/actions'

const defaultState = {
  activePlan: null,
  dataItems: {},
  uploadDataSources: []
}

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

function setDataItems (state, dataItems, uploadDataSources) {
  return { ...state,
    dataItems: dataItems,
    uploadDataSources: uploadDataSources
  }
}

function planReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.PLAN_SET_ACTIVE_PLAN:
      return setActivePlan(state, action.payload.plan)

    case Actions.PLAN_SET_ACTIVE_PLAN_STATE:
      return setActivePlanState(state, action.payload)

    case Actions.PLAN_SET_DATA_ITEMS:
      return setDataItems(state, action.payload.dataItems, action.payload.uploadDataSources)

    default:
      return state
  }
}

export default planReducer
