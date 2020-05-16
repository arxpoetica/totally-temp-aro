import Actions from '../../common/actions'

const defaultState = {
  ductEdit: {
    ducts: {},
    selectedDuctId: null
  }
}

function setSelectedDuctId (state, selectedDuctId) {
  return { ...state,
    ductEdit: { ...state.ductEdit, selectedDuctId: selectedDuctId }
  }
}

function setDuct (state, ductId, duct) {
  var newDuct = {}
  newDuct[ductId] = duct
  // setting newSelectedDuctId with a new duct
  //  kind of belongs in actions but we don't have batch set up there yet
  var newSelectedDuctId = state.ductEdit.selectedDuctId
  if (!state.ductEdit.ducts.hasOwnProperty(ductId)) newSelectedDuctId = ductId
  return { ...state,
    ductEdit: { ...state.ductEdit,
      ducts: { ...state.ductEdit.ducts, ...newDuct},
      selectedDuctId: newSelectedDuctId
    }
  }
}

function deleteDuct (state, ductId) {
  var newDucts = { ...state.ductEdit.ducts }
  delete newDucts[ductId]
  return { ...state,
    ductEdit: { ...state.ductEdit,
      ducts: newDucts
    }
  }
}

function setDucts (state, ducts) {
  var newSelectedDuctId = state.ductEdit.selectedDuctId
  if (!ducts.hasOwnProperty(newSelectedDuctId)) newSelectedDuctId = null
  return { ...state,
    ductEdit: {
      ducts: ducts,
      selectedDuctId: newSelectedDuctId
    }
  }
}

function dataEditReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.DATA_DUCT_SET_SELECTED_DUCT_ID:
      return setSelectedDuctId(state, action.payload)

    case Actions.DATA_DUCT_SET_DUCT:
      return setDuct(state, action.payload.ductId, action.payload.duct)

    case Actions.DATA_DUCT_DELETE_DUCT:
      return deleteDuct(state, action.payload)

    case Actions.DATA_DUCT_SET_DUCTS:
      return setDucts(state, action.payload)

    default:
      return state
  }
}

export default dataEditReducer
