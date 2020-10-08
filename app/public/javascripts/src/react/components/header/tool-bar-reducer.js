import Actions from '../../common/actions'

const defaultState = {
  planInputsModal: false,
  rSelectedDisplayMode:'VIEW',
  rActiveViewModePanel:'LOCATION_INFO',
  selectedToolBarAction: null,
  selectedTargetSelectionMode: 0,
  isRulerEnabled: false,
  isViewSettingsEnabled: false,
  showDirectedCable: false,
  showEquipmentLabels: false,
  showFiberSize: false,
  nameToServiceLayers: {},
  listOfTags: [],
  currentPlanTags: [],
  listOfServiceAreaTags: [],
  currentPlanServiceAreaTags: []
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

function setIsViewSettingsEnabled (state, isViewSettingsEnabled) {
  return { ...state,
    isViewSettingsEnabled: isViewSettingsEnabled
  }
}

function setShowDirectedCable (state, showDirectedCable) {
  return { ...state,
    showDirectedCable: showDirectedCable
  }
}

function setShowEquipmentLabelsChanged (state, showEquipmentLabels) {
  return { ...state,
    showEquipmentLabels: showEquipmentLabels
  }
}

function setShowFiberSize (state, showFiberSize) {
  return { ...state,
    showFiberSize: showFiberSize
  }
}

function setAppConfiguration (state, appConfiguration) {
  return { ...state,
    appConfiguration: appConfiguration
  }
}

function setLoadListOfPlanTags (state, listOfTags) {
  return { ...state,
    listOfTags: listOfTags
  }
}

function setCurrentPlanTags (state, currentPlanTags) {
  return { ...state,
    currentPlanTags: currentPlanTags
  }
}

function setCurrentPlanServiceAreaTags (state, currentPlanServiceAreaTags) {
  return { ...state,
    currentPlanServiceAreaTags: currentPlanServiceAreaTags
  }
}

function setLoadServiceLayers (state, nameToServiceLayers) {
  return { ...state,
    nameToServiceLayers: nameToServiceLayers
  }
}

function setLoadListOfSAPlanTags (state, listOfServiceAreaTags) {
  return { ...state,
    listOfServiceAreaTags: listOfServiceAreaTags
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
      
    case Actions.TOOL_BAR_IS_VIEW_SETTINGS_ENABLED:
      return setIsViewSettingsEnabled(state, action.payload)
      
    case Actions.TOOL_BAR_SHOW_DIRECTED_CABLE:
      return setShowDirectedCable(state, action.payload)  
      
    case Actions.TOOL_BAR_SHOW_EQUIPMENT_LABELS:
      return setShowEquipmentLabelsChanged(state, action.payload) 
      
    case Actions.TOOL_BAR_SHOW_FIBER_SIZE:
      return setShowFiberSize(state, action.payload) 

    case Actions.TOOL_BAR_SET_APP_CONFIGURATION:
      return setAppConfiguration(state, action.payload) 
      
    case Actions.TOOL_BAR_LIST_OF_PLAN_TAGS:
      return setLoadListOfPlanTags(state, action.payload) 
      
    case Actions.TOOL_BAR_SET_CURRENT_PLAN_TAGS:
      return setCurrentPlanTags(state, action.payload) 
      
    case Actions.TOOL_BAR_SET_CURRENT_PLAN_SA_TAGS:
      return setCurrentPlanServiceAreaTags(state, action.payload)       

    case Actions.TOOL_BAR_LOAD_SERVICE_LAYERS:
      return setLoadServiceLayers(state, action.payload)  

      case Actions.TOOL_BAR_LIST_OF_SERVICE_AREA_TAGS:
        return setLoadListOfSAPlanTags(state, action.payload)      

    default:
      return state
  }
}

export default ToolBarReducer
