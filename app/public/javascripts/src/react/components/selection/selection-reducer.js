import Actions from '../../common/actions'

const defaultState = {
  selectionModes: [
    { id: 'SELECTED_AREAS', description: 'Service Areas' },
    { id: 'SELECTED_LOCATIONS', description: 'Locations' },
    { id: 'SELECTED_ANALYSIS_AREAS', description: 'Analysis Areas' }
  ],
  activeSelectionMode: { id: 'SELECTED_AREAS', description: 'Service Areas' }
}

function setActiveSelectionModeById(state, newSelectionModeId) {
  const selectionMode = state.selectionModes.filter(item => item.id === newSelectionModeId)[0]
  return { ...state, activeSelectionMode: selectionMode }
}

function selectionReducer(state = defaultState, action) {
  switch(action.type) {
    case Actions.SELECTION_SET_ACTIVE_MODE:
      return setActiveSelectionModeById(state, action.payload)

    default:
      return state
  }
}

export default selectionReducer
