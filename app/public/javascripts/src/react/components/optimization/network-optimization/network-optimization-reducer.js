import Actions from '../../../common/actions'
// import ObjectUtils from '../../../../shared-utils/object-utils'

const defaultState = {
  optimizationInputs: {}, // will hydrate from config settings
  isCanceling: false,
  optimizationId: null,
  filters: [],
  activeFilters: [],
  isPreviewLoading: false,
}

function setLocationType (state, locationType, isIncluded) {
  // optimization.networkOptimization.optimizationInputs.locationConstraints.locationTypes
  const safeLocationTypes = (state.optimizationInputs.locationConstraints && state.optimizationInputs.locationConstraints.locationTypes) || []
  var locationTypes = JSON.parse(JSON.stringify(safeLocationTypes))
  var index = locationTypes.indexOf(locationType)
  var currentIsIncluded = index !== -1
  if (currentIsIncluded === isIncluded) return state
  if (isIncluded) {
    locationTypes.push(locationType)
  } else {
    locationTypes.splice(index, 1)
  }
  return { ...state,
    optimizationInputs: { ...state.optimizationInputs,
      locationConstraints: { ...state.optimizationInputs.locationConstraints,
        locationTypes: locationTypes
      }
    }
  }
}

function setNetworkAnalysisType (state, networkAnalysisType) {
  return { ...state,
    optimizationInputs: { ...state.optimizationInputs,
      analysis_type: networkAnalysisType
    }
  }
}

function setOptimizationInputs (state, inputs) {
  var newState = { ...state,
    optimizationInputs: { ...state.optimizationInputs, ...inputs }
  }

  return newState
}

function setIsCanceling (state, isCanceling) {
  var newState = { ...state,
    isCanceling: isCanceling
  }
  return newState
}

function setOptimizationId (state, optimizationId) {
  var newState = { ...state,
    optimizationId: optimizationId
  }
  return newState
}

function clearOptimizationId (state) {
  return setOptimizationId(state, null)
}

function setFilters (state, filters) {
  return {...state, filters: filters}
}

function setActiveFilters (state, filters) {
  return {...state, activeFilters: filters}
}

function setIsPreviewLoading (state, isPreviewLoading) {
  return {...state, isPreviewLoading }
}

function optimizationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_INPUTS:
      return setOptimizationInputs(state, action.payload)
    case Actions.NETWORK_OPTIMIZATION_SET_ANALYSIS_TYPE:
      return setNetworkAnalysisType(state, action.payload)
    case Actions.NETWORK_OPTIMIZATION_SET_LOCATION_TYPE:
      return setLocationType(state, action.payload.locationType, action.payload.isIncluded)
    case Actions.NETWORK_OPTIMIZATION_SET_IS_CANCELING:
      return setIsCanceling(state, action.payload)
    case Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_ID:
      return setOptimizationId(state, action.payload)
    case Actions.NETWORK_OPTIMIZATION_CLEAR_OPTIMIZATION_ID:
      return clearOptimizationId(state)
    case Actions.NETWORK_OPTIMIZATION_SET_FILTERS:
      return setFilters(state, action.payload)
    case Actions.NETWORK_OPTIMIZATION_SET_ACTIVE_FILTERS:
      return setActiveFilters(state, action.payload)
    case Actions.NETWORK_OPTIMIZATION_SET_IS_PREVIEW_LOADING:
      return setIsPreviewLoading(state, action.payload)
    default:
      return state
  }
}

export default optimizationReducer
