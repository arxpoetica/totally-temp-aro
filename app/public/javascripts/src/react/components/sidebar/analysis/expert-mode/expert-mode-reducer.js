import Actions from '../../../../common/actions'

const defaultState = {
  expertMode: {
    MANUAL_PLAN_TARGET_ENTRY: '',
    MANUAL_PLAN_SA_ENTRY: ''
  },
  expertModeTypes: {
    MANUAL_PLAN_TARGET_ENTRY: { id: 'MANUAL_PLAN_TARGET_ENTRY', label: 'Manual plan Target Selection', isQueryValid: false },
    MANUAL_PLAN_SA_ENTRY: { id: 'MANUAL_PLAN_SA_ENTRY', label: 'Manual Plan Service Area Selection', isQueryValid: false }
  },
  selectedExpertMode: 'MANUAL_PLAN_TARGET_ENTRY',
  scopeContextKeys: [],
  expertModeScopeContext: ''
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

function ExpertModeReducer (state = defaultState, action) {
  switch (action.type) {

    case Actions.EXPERT_MODE_SELECTED_EXPERT_MODE:
      return setSelectedExpertMode(state, action.payload)

    case Actions.EXPERT_MODE_GET_SCOPE_CONTEXT:
      return setExpertModeScopeContext(state, action.payload)

    case Actions.EXPERT_MODE_GET_SUPER_CONTEXT_KEYS:
      return setAvailableScopeContextKeys(state, action.payload)

    case Actions.EXPERT_MODE_SET_EXPERT_MODE:
      return setExpertMode(state, action.payload)

    case Actions.EXPERT_MODE_SET_EXPERT_MODE_TYPES:
      return setExpertModeTypes(state, action.payload)

    default:
      return state
  }
}

export default ExpertModeReducer
