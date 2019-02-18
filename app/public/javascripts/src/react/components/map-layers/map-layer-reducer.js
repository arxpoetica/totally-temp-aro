import Actions from '../../common/actions'
import { List } from 'immutable'

const defaultState = {
  location: new List(),
  boundary: new List()
}

function setLayers (state, layerKey, layers) {
  return { ...state, [layerKey]: layers }
}

function setLayerVisibility (state, layer, visibility) {
  // First determine which category/key (e.g. 'location' the layer belongs to)
  var layerToChange = null; var layerKey = null; var layerIndex = NaN
  Object.keys(state).forEach(key => {
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

function mapLayersReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.LAYERS_SET_LOCATION:
      return setLayers(state, 'location', action.payload)

    case Actions.LAYERS_SET_BOUNDARY:
      return setLayers(state, 'boundary', action.payload)

    case Actions.LAYERS_SET_VISIBILITY:
      return setLayerVisibility(state, action.payload.layer, action.payload.visibility)

    default:
      return state
  }
}

export default mapLayersReducer
