import Actions from '../../common/actions'
import SelectionModes from './selection-modes'

const defaultState = {
  selectionModes: [
    { id: SelectionModes.SELECTED_AREAS, description: 'Service Areas' },
    { id: SelectionModes.SELECTED_LOCATIONS, description: 'Locations' },
    { id: SelectionModes.SELECTED_ANALYSIS_AREAS, description: 'Analysis Areas' }
  ],
  activeSelectionMode: { id: 'SELECTED_AREAS', description: 'Service Areas' },
  planTargets: new Set()
}

function setActiveSelectionModeById (state, newSelectionModeId) {
  const selectionMode = state.selectionModes.filter(item => item.id === newSelectionModeId)[0]
  return { ...state, activeSelectionMode: selectionMode }
}

function clearAllPlanTargets (state) {
  return { ...state, planTargets: new Set() }
}

function addPlanTargets (state, planTargets) {
  var newPlanTargets = new Set(state.planTargets)
  planTargets.forEach(target => newPlanTargets.add(target))
  return { ...state, planTargets: newPlanTargets }
}

function removePlanTargetIds (state, idsToRemove) {
  var newPlanTargets = new Set(state.planTargets)
  newPlanTargets.forEach(target => {
    if (idsToRemove.has(target.id)) {
      newPlanTargets.delete(target)
    }
  })
  return { ...state, planTargets: newPlanTargets }
}

function selectionReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.SELECTION_SET_ACTIVE_MODE:
      return setActiveSelectionModeById(state, action.payload)

    case Actions.SELECTION_CLEAR_ALL_PLAN_TARGETS:
      return clearAllPlanTargets(state)

    case Actions.SELECTION_ADD_PLAN_TARGETS:
      return addPlanTargets(state, action.payload)

    case Actions.SELECTION_REMOVE_PLAN_TARGETS:
      return removePlanTargetIds(state, action.payload)

    default:
      return state
  }
}

export default selectionReducer
