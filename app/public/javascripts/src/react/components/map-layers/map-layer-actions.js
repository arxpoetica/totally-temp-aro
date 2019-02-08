import Actions from '../../common/actions'

// Sets the visibility for a specified layer
function setLayerVisibility(layer, newVisibility) {
  return {
    type: Actions.SET_LAYER_VISIBILITY,
    payload: {
      layer: layer,
      visibility: newVisibility
    }
  }
}

export default {
  setLayerVisibility: setLayerVisibility
}
