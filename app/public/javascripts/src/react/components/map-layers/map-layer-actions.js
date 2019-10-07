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

function setNetworkEquipmentLayerVisibility (layerType, layer, newVisibility) {
  return {
    type: Actions.LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY,
    payload: {
      layerType: layerType,
      layer: layer,
      subtype: 0,
      visibility: newVisibility
    }
  }
}

function setNetworkEquipmentSubtypeVisibility (layerType, layer, subtypeId, newVisibility) {
  return {
    type: Actions.LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY,
    payload: {
      layerType: layerType,
      layer: layer,
      subtype: subtypeId,
      visibility: newVisibility
    }
  }
}

function setCableConduitVisibility (cableKey, conduitKey, newVisibility) {
  return {
    type: Actions.LAYERS_SET_CABLE_CONDUIT_VISIBILITY,
    payload: {
      cableKey: cableKey,
      conduitKey: conduitKey,
      visibility: newVisibility
    }
  }
}

function setNetworkEquipmentLayers (networkEquipmentLayers) {
  return {
    type: Actions.LAYERS_SET_NETWORK_EQUIPMENT,
    payload: networkEquipmentLayers
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

function setShowSiteBoundary (newVisibility) {
  return {
    type: Actions.LAYERS_SET_SITE_BOUNDARY,
    payload: {
      visibility: newVisibility
    }
  }
}

export default {
  setLayerVisibility: setLayerVisibility,
  setNetworkEquipmentLayerVisibility: setNetworkEquipmentLayerVisibility,
  setNetworkEquipmentSubtypeVisibility: setNetworkEquipmentSubtypeVisibility,
  setCableConduitVisibility: setCableConduitVisibility,
  setNetworkEquipmentLayers: setNetworkEquipmentLayers,
  setConstructionSiteLayers: setConstructionSiteLayers,
  setBoundaryLayers: setBoundaryLayers,
  setShowSiteBoundary: setShowSiteBoundary
}
