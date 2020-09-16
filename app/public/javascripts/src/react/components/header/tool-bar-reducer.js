import Actions from '../../common/actions'

const defaultState = {
  planInputsModal: false,
  rSelectedDisplayMode:'VIEW',
  rActiveViewModePanel:'LOCATION_INFO',
  selectedToolBarAction: null,
  selectedTargetSelectionMode: 0,
  isRulerEnabled: false
}

function setPlanInputsModal (state, planInputsModal) {
  return { ...state,
    planInputsModal: planInputsModal
  }
}

function setSelectedDisplayMode (state, displayMode) {
  return { ...state,
    rSelectedDisplayMode: displayMode,
  }
}

function setActiveViewModePanel (state, viewMode) {
  return { ...state,
    rActiveViewModePanel: viewMode
  }
}

function setSelectedToolBarAction (state, selectedToolBarAction) {
  return { ...state,
    selectedToolBarAction: selectedToolBarAction
  }
}

function setSelectedTargetSelectionMode (state, selectedTargetSelectionMode) {
  return { ...state,
    selectedTargetSelectionMode: selectedTargetSelectionMode
  }
}

function setIsRulerEnabled (state, isRulerEnabled) {
  return { ...state,
    isRulerEnabled: isRulerEnabled
  }
}

function ToolBarReducer (state = defaultState, action) {
  switch (action.type) {

    case Actions.TOOL_BAR_SET_SAVE_PLAN_AS:
      return setPlanInputsModal(state, action.payload)
      
    case Actions.TOOL_BAR_SET_SELECTED_DISPLAY_MODE:
      return setSelectedDisplayMode(state, action.payload) 

    case Actions.TOOL_BAR_SET_ACTIVE_VIEW_MODE_PANEL:
      return setActiveViewModePanel(state, action.payload)   
      
    case Actions.TOOL_BAR_SELECTED_TOOL_BAR_ACTION:
      return setSelectedToolBarAction(state, action.payload) 

    case Actions.TOOL_BAR_SELECTED_TARGET_SELECTION_MODE:
      return setSelectedTargetSelectionMode(state, action.payload) 
      
    case Actions.TOOL_BAR_IS_RULER_ENABLED:
      return setIsRulerEnabled(state, action.payload)      
  
    default:
      return state
  }
}

export default ToolBarReducer
