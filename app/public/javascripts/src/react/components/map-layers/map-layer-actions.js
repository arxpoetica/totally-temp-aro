import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'

// Sets the visibility for a specified layer
// ToDo: LOCATIONS refactor callers of this to send layer Key instead of whole layer
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

function loadAnnotationsForUser (userId) {
  return dispatch => {
    return AroHttp.get(`/service/auth/users/${userId}/configuration`)
      .then(result => {
        const annotations = result.data.annotations || [{ name: 'Default Annotation', geometries: [] }]
        dispatch({
          type: Actions.LAYERS_SET_ANNOTATIONS,
          payload: annotations
        })
      })
      .catch(err => console.error(err))
  }
}

function saveAnnotationsForUser (userId, annotations) {
  return dispatch => {
    return AroHttp.get(`/service/auth/users/${userId}/configuration`)
      .then(result => {
        const newConfiguration = { ...result.data,
          annotations: annotations // Replace just the annotations
        }
        return AroHttp.post(`/service/auth/users/${userId}/configuration`, newConfiguration)
      })
      .catch(err => console.error(err))
  }
}

function addAnnotation (annotation) {
  return {
    type: Actions.LAYERS_ADD_ANNOTATION,
    payload: annotation
  }
}

function updateAnnotation (index, annotation) {
  return {
    type: Actions.LAYERS_UPDATE_ANNOTATION,
    payload: {
      index,
      annotation
    }
  }
}

function removeAnnotation (annotation) {
  return {
    type: Actions.LAYERS_REMOVE_ANNOTATION,
    payload: annotation
  }
}

function setAnnotationListVisibility (isVisible) {
  return {
    type: Actions.LAYERS_SHOW_ANNOTATION_LIST,
    payload: isVisible
  }
}

function clearOlderAnnotations (numberToClear) {
  return {
    type: Actions.LAYERS_CLEAR_OLD_ANNOTATIONS,
    payload: numberToClear
  }
}

export default {
  setLayerVisibility,
  setNetworkEquipmentLayerVisibility,
  setNetworkEquipmentSubtypeVisibility,
  setCableConduitVisibility,
  setNetworkEquipmentLayers,
  setConstructionSiteLayers,
  setBoundaryLayers,
  setShowSiteBoundary,
  loadAnnotationsForUser,
  saveAnnotationsForUser,
  addAnnotation,
  updateAnnotation,
  removeAnnotation,
  setAnnotationListVisibility,
  clearOlderAnnotations
}
