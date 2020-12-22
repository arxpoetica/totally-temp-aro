import Actions from '../../../common/actions'

const defaultState = {
  enumStrings: {},
  networkNodeTypesEntity: {},
  expertMode: {
    OPTIMIZATION_SETTINGS: '',
    MANUAL_PLAN_TARGET_ENTRY: '',
    MANUAL_PLAN_SA_ENTRY: ''
  },
  expertModeTypes: {
    OPTIMIZATION_SETTINGS: { id: 'OPTIMIZATION_SETTINGS', label: 'Optimization Settings' },
    MANUAL_PLAN_TARGET_ENTRY: { id: 'MANUAL_PLAN_TARGET_ENTRY', label: 'Manual plan Target Selection', isQueryValid: false },
    MANUAL_PLAN_SA_ENTRY: { id: 'MANUAL_PLAN_SA_ENTRY', label: 'Manual Plan Service Area Selection', isQueryValid: false }
  },
  selectedExpertMode: 'MANUAL_PLAN_TARGET_ENTRY',
  scopeContextKeys: [],
  expertModeScopeContext: '',
  showRoicReportsModal: false,
  roicResults: null,
  xAxisLabels: [],
  planStateCons: Object.freeze({
    INITIALIZED: 'INITIALIZED',
    START_STATE: 'START_STATE',
    STARTED: 'STARTED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELED: 'CANCELED'
  })
}

function setEnumStrings (state, enumStrings) {
  return { ...state,
    enumStrings: enumStrings
  }
}

function setNetworkNodeTypesEntity (state, networkNodeTypesEntity) {
  return { ...state,
    networkNodeTypesEntity: networkNodeTypesEntity
  }
}

function setSelectedExpertMode (state, selectedExpertMode) {
  return { ...state,
    selectedExpertMode: selectedExpertMode
  }
}

function setExpertModeScopeContext (state, expertModeScopeContext) {
  return { ...state,
    expertModeScopeContext: expertModeScopeContext
  }
}

function setAvailableScopeContextKeys (state, scopeContextKeys) {
  return { ...state,
    scopeContextKeys: scopeContextKeys
  }
}

function setExpertMode (state, expertMode) {
  return { ...state,
    expertMode: expertMode
  }
}

function setExpertModeTypes (state, expertModeTypes) {
  return { ...state,
    expertModeTypes: expertModeTypes
  }
}

function setShowRoicReportsModal (state, showRoicReportsModal) {
  return { ...state,
    showRoicReportsModal: showRoicReportsModal
  }
}

function setROICResultsForPlan (state, roicResults) {
  return { ...state,
    roicResults: roicResults
  }
}

function setXaxisLabels (state, xAxisLabels) {
  return { ...state,
    xAxisLabels: xAxisLabels
  }
}

function AnalysisReducer (state = defaultState, action) {
  switch (action.type) {

    case Actions.ANALYSIS_MODE_ENUM_STRINGS:
      return setEnumStrings(state, action.payload)
      
    case Actions.ANALYSIS_MODE_NETWORK_NODE_TYPE_ENTITY:
      return setNetworkNodeTypesEntity(state, action.payload)
      
    case Actions.ANALYSIS_MODE_SELECTED_EXPERT_MODE:
      return setSelectedExpertMode(state, action.payload)
      
    case Actions.ANALYSIS_MODE_EXPERT_MODE_SCOPE_CONTEXT:
      return setExpertModeScopeContext(state, action.payload)

    case Actions.ANALYSIS_MODE_SUPER_CONTEXT_KEYS:
      return setAvailableScopeContextKeys(state, action.payload)

    case Actions.ANALYSIS_MODE_EXPERT_MODE:
      return setExpertMode(state, action.payload)
      
      case Actions.ANALYSIS_MODE_EXPERT_MODE_TYPES:
        return setExpertModeTypes(state, action.payload)
        
      case Actions.ANALYSIS_MODE_SHOW_ROIC_REPORT_MODAL:
        return setShowRoicReportsModal(state, action.payload) 
        
      case Actions.ANALYSIS_MODE_SET_ROIC_RESULTS_FOR_PLAN:
        return setROICResultsForPlan(state, action.payload)
        
      case Actions.ANALYSIS_MODE_SET_XAXIS_LABELS:
        return setXaxisLabels(state, action.payload)    

    default:
      return state
  }
}
  
  export default AnalysisReducer