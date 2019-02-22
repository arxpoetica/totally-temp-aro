import Actions from '../../common/actions'

// Sets the visibility for a specified layer
function setLayerVisibility (layer, newVisibility) {
  return {
    type: Actions.LAYERS_SET_VISIBILITY,
    payload: {
      layer: layer,
      visibility: newVisibility
    }
  }
}

function setConstructionSiteLayers (constructionSiteLayers) {
  return {
    type: Actions.LAYERS_SET_CONSTRUCTION_SITE,
    payload: constructionSiteLayers
  }
}

function setBoundaryLayers (boundaryLayers) {
  return {
    type: Actions.LAYERS_SET_BOUNDARY,
    payload: boundaryLayers
  }
}

export default {
  setLayerVisibility: setLayerVisibility,
  setConstructionSiteLayers: setConstructionSiteLayers,
  setBoundaryLayers: setBoundaryLayers
}
