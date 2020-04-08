import Actions from '../../common/actions'

const defaultState = {
  showToolBox: false,
  activeTool: null
}

function setToolboxVisibility (state, showToolBox) {
  return { ...state,
    showToolBox
  }
}

function setActiveTool (state, activeTool) {
  return { ...state,
    activeTool
  }
}

function userReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.TOOL_SET_TOOLBOX_VISIBILITY:
      return setToolboxVisibility(state, action.payload)

    case Actions.TOOL_SET_ACTIVE_TOOL:
      return setActiveTool(state, action.payload)

    default:
      return state
  }
}

export default userReducer
