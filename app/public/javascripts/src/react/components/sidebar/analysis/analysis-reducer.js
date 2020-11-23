import Actions from '../../../common/actions'

const defaultState = {
  enumStrings: {},
  networkNodeTypesEntity: [],
  expertModeTypes: {
    OPTIMIZATION_SETTINGS: { id: 'OPTIMIZATION_SETTINGS', label: 'Optimization Settings' },
    MANUAL_PLAN_TARGET_ENTRY: { id: 'MANUAL_PLAN_TARGET_ENTRY', label: 'Manual plan Target Selection', isQueryValid: false },
    MANUAL_PLAN_SA_ENTRY: { id: 'MANUAL_PLAN_SA_ENTRY', label: 'Manual Plan Service Area Selection', isQueryValid: false }
  }
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

    default:
      return state
  }
}
  
  export default AnalysisReducer