import Actions from '../../common/actions'
import { List, Map } from 'immutable'

const defaultState = {
  location: new List(),
  networkEquipment: new Map(),
  constructionSite: new List(),
  boundary: new List(),
  showSiteBoundary: false,
  selectedBoundaryType: new Map(),
  boundaryTypes: new List()
}

function setLayers (state, layerKey, layers) {
  // ToDo: this doesn't belong here
  if (layerKey === 'networkEquipment' && layers.hasOwnProperty('cables')) {
    Object.keys(layers.cables).forEach(key => {
      if (!layers.cables[key].hasOwnProperty('checked')) layers.cables[key].checked = false
      if (!layers.cables[key].hasOwnProperty('conduitVisibility')) layers.cables[key].conduitVisibility = {}
    })
  }
  return { ...state, [layerKey]: layers }
}

function setNetworkEquipmentLayerVisibility (state, layerType, layer, visibility) {
  var newState = { ...state }
  // First determine which category/key (e.g. 'location' the layer belongs to)
  var layerToChange = null; var layerKey = null
  Object.keys(state['networkEquipment'][layerType]).forEach((key, index) => {
    const stateLayer = state['networkEquipment'][layerType][key]
    if (stateLayer.key === layer.key) {
      layerToChange = stateLayer
      layerKey = key
    }
  })
  // Create a new layer with the checked flag set
  const newLayer = { ...layerToChange, checked: visibility }

  // Replace this category in the state
  newState = {
    ...newState,
    networkEquipment: {
      ...newState.networkEquipment,
      [layerType]: {
        ...newState.networkEquipment[layerType],
        [layerKey]: newLayer
      }
    }
  }

  return newState
}

function setCableConduitVisibility (state, cableKey, conduitKey, visibility) {
  /*
  newState = { ...state,
    networkEquipment: { ...state.networkEquipment,
      cables: { ...state.networkEquipment.cables,
        [cableKey]: { ...state.networkEquipment.cables[],

        }
      }
    }
  }
  */
  var newState = { ...state }
  newState.networkEquipment.cables[cableKey].conduitVisibility[conduitKey] = visibility

  return newState
}

function setLayerVisibility (state, layer, visibility) {
  // First determine which category/key (e.g. 'location' the layer belongs to)
  var layerToChange = null; var layerKey = null; var layerIndex = NaN
  const list = ['location', 'constructionSite', 'boundary']
  // Object.keys(state).forEach(key => {
  list.forEach(key => {
    const layers = state[key]
    layers.forEach((stateLayer, index) => {
      if (stateLayer.key === layer.key && stateLayer.uiLayerId === layer.uiLayerId) {
        layerToChange = stateLayer
        layerKey = key
        layerIndex = index
      }
    })
  })
  // Create a new layer with the checked flag set
  const newLayer = { ...layerToChange, checked: visibility }
  // Replace this category in the state
  return { ...state, [layerKey]: state[layerKey].set(layerIndex, newLayer) }
}

function setShowSiteBoundary (state, visibility) {
  return { ...state, showSiteBoundary: visibility }
}

function mapLayersReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.LAYERS_SET_LOCATION:
      return setLayers(state, 'location', action.payload)

    case Actions.LAYERS_SET_NETWORK_EQUIPMENT:
      return setLayers(state, 'networkEquipment', action.payload)

    case Actions.LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY:
      return setNetworkEquipmentLayerVisibility(state, action.payload.layerType, action.payload.layer, action.payload.visibility)

    case Actions.LAYERS_SET_CABLE_CONDUIT_VISIBILITY:
      return setCableConduitVisibility(state, action.payload.cableKey, action.payload.conduitKey, action.payload.visibility)

    case Actions.LAYERS_SET_CONSTRUCTION_SITE:
      return setLayers(state, 'constructionSite', action.payload)

    case Actions.LAYERS_SET_BOUNDARY:
      return setLayers(state, 'boundary', action.payload)

    case Actions.LAYERS_SET_VISIBILITY:
      return setLayerVisibility(state, action.payload.layer, action.payload.visibility)

    case Actions.LAYERS_SET_SELECTED_BOUNDARY_TYPE:
      return setLayers(state, 'selectedBoundaryType', action.payload)

    case Actions.LAYERS_SET_BOUNDARY_TYPES:
      return setLayers(state, 'boundaryTypes', action.payload)

    case Actions.LAYERS_SET_SITE_BOUNDARY:
      return setShowSiteBoundary(state, action.payload.visibility)

    default:
      return state
  }
}

export default mapLayersReducer
