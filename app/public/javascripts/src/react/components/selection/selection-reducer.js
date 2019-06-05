import Actions from '../../common/actions'
import SelectionModes from './selection-modes'

const defaultState = {
  selectionModes: [
    { id: SelectionModes.SELECTED_AREAS, description: 'Service Areas' },
    { id: SelectionModes.SELECTED_LOCATIONS, description: 'Locations' },
    { id: SelectionModes.SELECTED_ANALYSIS_AREAS, description: 'Analysis Areas' },
    { id: SelectionModes.SELECTED_ALL_SERVICE_AREAS, description: 'All Service Areas' }
  ],
  activeSelectionMode: { id: 'SELECTED_AREAS', description: 'Service Areas' },
  planTargets: {
    locations: new Set(),
    serviceAreas: new Set(),
    analysisAreas: new Set()
  },
  planTargetDescriptions: {
    locations: {},
    serviceAreas: {},
    analysisAreas: {}
  }
}

function setActiveSelectionModeById (state, newSelectionModeId) {
  const selectionMode = state.selectionModes.filter(item => item.id === newSelectionModeId)[0]
  return { ...state, activeSelectionMode: selectionMode }
}

function clearAllPlanTargets (state) {
  return {
    ...state,
    planTargets: {
      locations: new Set(),
      serviceAreas: new Set(),
      analysisAreas: new Set()
    },
    planTargetDescriptions: {
      locations: {},
      serviceAreas: {},
      analysisAreas: {}
    }
  }
}

function addPlanTargets (state, planTargets) {
  var newState = { ...state }
  Object.keys(planTargets).forEach(targetType => {
    var newIds = new Set(state.planTargets[targetType])
    planTargets[targetType].forEach(targetId => newIds.add(targetId))
    newState = {
      ...newState,
      planTargets: {
        ...newState.planTargets,
        [targetType]: newIds
      }
    }
  })
  return newState
}

function removePlanTargetIds (state, planTargets) {
  var newState = { ...state }
  Object.keys(planTargets).forEach(targetType => {
    var newIds = new Set(state.planTargets[targetType])
    var isModified = false
    newIds.forEach(targetId => {
      if (planTargets[targetType].has(targetId)) {
        newIds.delete(targetId)
        isModified = true
      }
    })
    if (isModified) {
      newState = {
        ...newState,
        planTargets: {
          ...newState.planTargets,
          [targetType]: newIds
        }
      }
    }
  })
  return newState
}

function addPlanTargetDescriptions (state, planTargetDescriptions) {
  var newState = { ...state }
  Object.keys(planTargetDescriptions).forEach(targetType => {
    newState = {
      ...newState,
      planTargetDescriptions: {
        ...newState.planTargetDescriptions,
        [targetType]: {
          ...newState.planTargetDescriptions[targetType],
          ...planTargetDescriptions[targetType]
        }
      }
    }
  })
  return newState
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

    case Actions.SELECTION_ADD_PLAN_TARGET_DESCRIPTIONS:
      return addPlanTargetDescriptions(state, action.payload)

    default:
      return state
  }
}

export default selectionReducer
