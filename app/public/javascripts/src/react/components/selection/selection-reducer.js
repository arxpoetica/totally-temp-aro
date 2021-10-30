import Actions from '../../common/actions'
import SelectionModes from './selection-modes'

const defaultState = {
  selectionModes: [
    { id: SelectionModes.SELECTED_AREAS, description: 'Service Areas' },
    { id: SelectionModes.SELECTED_LOCATIONS, description: 'Locations' },
    { id: SelectionModes.SELECTED_ANALYSIS_AREAS, description: 'Analysis Areas' },
    // NOTE: commenting out to see if legacy errors come from Angular app
    // { id: SelectionModes.ALL_SERVICE_AREAS, description: 'All Service Areas' },
    // { id: SelectionModes.ALL_PLAN_AREAS, description: 'All Plan Areas' }
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
  },
  locations: new Set(),
  planEditorFeatures: [],// DEPRICATED
  mapFeatures: {},
  selection: {
    details: {
      analysisAreaId: null,
      censusBlockId: null,
      layerCategoryId: null,
      roadSegments: new Set(),
      serviceAreaId: null,
      fiberSegments: new Set(),
      siteBoundaryId: null
    },
    editable: {
      equipment: {},
      location: {},
      serviceArea: {}
    }
  },
  isMapClicked: false,
  selectedMapObject: null,
  objectIdToMapObject: {},
}

function setActiveSelectionModeById (state, newSelectionModeId) {
  var selectionMode = state.selectionModes.filter(item => item.id === newSelectionModeId)[0]
  if (typeof selectionMode === 'undefined') {
    selectionMode = state.selectionModes[0]
  }
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

function addLocations (state, locationIds) {
  return { ...state,
    locations: new Set(locationIds)
  }
}

function setMapFeatures (state, mapFeatures) {
  return { ...state,
    mapFeatures: mapFeatures
  }
}

function setRoadSegments(state, roadSegments) {
  return {
    ...state,
    mapFeatures: {
      ...state.mapFeatures,
      roadSegments,
    },
  }
}

// DEPRICATED
function setPlanEditorSelectedFeatures (state, planEditorFeatures) {
  return { ...state,
    planEditorFeatures: planEditorFeatures
  }
}

function setMapSelection (state, mapSelection) {
  return { ...state,
    selection: mapSelection
  }
}

function setIsMapClicked (state, isMapClicked) {
  return { ...state,
    isMapClicked: isMapClicked
  }
}

function setSelectedMapObject (state, selectedMapObject) {
  return { ...state, selectedMapObject: selectedMapObject }
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

    case Actions.SELECTION_SET_LOCATIONS:
      return addLocations(state, action.payload)

    case Actions.SELECTION_SET_MAP_FEATURES:
      return setMapFeatures(state, action.payload)

    case Actions.SELECTION_SET_ROAD_SEGMENTS:
      return setRoadSegments(state, action.payload)

    case Actions.SELECTION_SET_PLAN_EDITOR_FEATURES:
      return setPlanEditorSelectedFeatures(state, action.payload)

    case Actions.SELECTION_SET_MAP_SELECTION:
    return setMapSelection(state, action.payload)

    case Actions.SELECTION_SET_IS_MAP_CLICKED:
    return setIsMapClicked(state, action.payload)

    case Actions.SELECTION_SET_SELECTED_MAP_OBJECT:
      return setSelectedMapObject(state, action.payload)

    case Actions.SELECTION_SET_OBJECTID_TO_MAP_OBJECT:
      return { ...state, objectIdToMapObject: action.payload }

    default:
      return state
  }
}

export default selectionReducer
