import Actions from '../../common/actions'

// Sets the visibility for a specified layer
function setLayerVisibility(layer, newVisibility) {
  return {
    type: Actions.LAYERS_SET_VISIBILITY,
    payload: {
      layer: layer,
      visibility: newVisibility
    }
  }
}

function setBoundaryLayers(boundaryLayers) {
  return {
    type: Actions.LAYERS_SET_BOUNDARY,
    payload: boundaryLayers
  }
}

export default {
  setLayerVisibility: setLayerVisibility,
  setBoundaryLayers: setBoundaryLayers
}
