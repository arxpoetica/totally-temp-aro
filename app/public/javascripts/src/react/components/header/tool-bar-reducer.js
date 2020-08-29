import Actions from '../../common/actions'


const defaultState = {
  planInputsModal: false
}

function setPlanInputsModal (state, planInputsModal) {
  return { ...state,
    planInputsModal: planInputsModal
  }
}

function ToolBarReducer (state = defaultState, action) {
  switch (action.type) {

    case Actions.TOOL_BAR_SET_SAVE_PLAN_AS:
      return setPlanInputsModal(state, action.payload)     
  
    default:
      return state

  }
}

export default ToolBarReducer
