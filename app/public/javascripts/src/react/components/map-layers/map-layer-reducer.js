import Actions from '../../common/actions'
import { List, Map, remove } from 'immutable'

const defaultState = {
  location: new List(),
  networkEquipment: new Map(),
  constructionSite: new List(),
  boundary: new List(),
  showSiteBoundary: false,
  selectedBoundaryType: new Map(),
  boundaryTypes: new List(),
  annotation: {
    showList: false,
    selectedIndex: 0,
    collections: [],
    maxGeometries: 200
  }
}

// ToDo: reafctor "checked" to be a collection of subtypes, also make a class 
function setLayers (state, layerKey, layers) {
  // ToDo: this doesn't belong here
  if (layerKey === 'networkEquipment') {
    if (layers.hasOwnProperty('cables')) {
      Object.keys(layers.cables).forEach(key => {
        if (!layers.cables[key].hasOwnProperty('checked')) layers.cables[key].checked = false
        if (!layers.cables[key].hasOwnProperty('conduitVisibility')) layers.cables[key].conduitVisibility = {}
      })
    }

    if (layers.hasOwnProperty('equipments')) {
      Object.keys(layers.equipments).forEach(key => {
        if (!layers.equipments[key].hasOwnProperty('checked')) layers.equipments[key].checked = false
        if (!layers.equipments[key].hasOwnProperty('subtypes')) layers.equipments[key].subtypes = {}
      })
    }
  }
  return { ...state, [layerKey]: layers }
}

function setNetworkEquipmentLayerVisibility (state, layerType, layer, subtype, visibility) {
  var newState = { ...state }
  // First determine which category/key (e.g. 'location' the layer belongs to)
  var layerToChange = null
  var layerKey = null
  var anyVisibility = visibility
  Object.keys(state['networkEquipment'][layerType]).forEach((key, index) => {
    const stateLayer = state['networkEquipment'][layerType][key]
    if (stateLayer.key === layer.key) {
      layerToChange = stateLayer
      layerKey = key
    }
  })
  var subtypes = { ...layerToChange.subtypes }
  subtypes[subtype] = visibility
  if (!anyVisibility) {
    Object.keys(subtypes).forEach(key => {
      // if any of the subtypes are visible we need to get the whole layer 
      // then tile renderer will filter by subtype
      anyVisibility = anyVisibility || subtypes[key]
    })
  }
  // Create a new layer with the checked flag set
  const newLayer = { ...layerToChange, checked: anyVisibility, subtypes: subtypes }

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
  // ToDo: this is ugly
  return {
    ...state,
    networkEquipment: {
      ...state.networkEquipment,
      cables: {
        ...state.networkEquipment.cables,
        [cableKey]: {
          ...state.networkEquipment.cables[cableKey],
          conduitVisibility: {
            ...state.networkEquipment.cables[cableKey].conduitVisibility,
            [conduitKey]: visibility
          }
        }
      }
    }
  }
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

function setAnnotations (state, annotations) {
  return { ...state,
    annotation: { ...state.annotation,
      selectedIndex: 0,
      collections: annotations
    }
  }
}

function addAnnotation (state, annotation) {
  return { ...state,
    annotation: { ...state.annotation,
      collections: state.annotation.collections.concat(annotation)
    }
  }
}

function updateAnnotation (state, indexToUpdate, annotation) {
  var newCollections = [].concat(state.annotation.collections)
  newCollections.splice(indexToUpdate, 1, annotation)
  return { ...state,
    annotation: { ...state.annotation,
      collections: newCollections
    }
  }
}

function removeAnnotation (state, annotation) {
  const indexToRemove = state.annotation.collections.findIndex(item => item.id === annotation.id)
  var newCollections = [].concat(state.annotation.collections)
  newCollections.splice(indexToRemove, 1)
  return { ...state,
    annotation: { ...state.annotation,
      collections: newCollections
    }
  }
}

function setShowAnnotationsList (state, showAnnotationsList) {
  return { ...state,
    annotation: { ...state.annotation,
      showList: showAnnotationsList
    }
  }
}

function clearOlderGeometries (state, annotationIndex, numberOfGeometries) {
  var updatedGeometries = state.annotation.collections[annotationIndex].geometries
  updatedGeometries = updatedGeometries.splice(0, numberOfGeometries) // Index 0 will be the "oldest" geometry
  const updatedAnnotation = { ...state.annotation.collections[annotationIndex],
    geometries: updatedGeometries
  }
  var newCollections = [].concat(state.annotation.collections)
  newCollections.splice(annotationIndex, 1, updatedAnnotation)
  return { ...state,
    annotation: { ...state.annotation,
      collections: newCollections,
      selectedIndex: 0
    }
  }
}

function mapLayersReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.LAYERS_SET_LOCATION:
      return setLayers(state, 'location', action.payload)

    case Actions.LAYERS_SET_NETWORK_EQUIPMENT:
      return setLayers(state, 'networkEquipment', action.payload)

    case Actions.LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY:
      return setNetworkEquipmentLayerVisibility(state, action.payload.layerType, action.payload.layer, action.payload.subtype, action.payload.visibility)

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

    case Actions.LAYERS_SET_ANNOTATIONS:
      return setAnnotations(state, action.payload)

    case Actions.LAYERS_ADD_ANNOTATION:
      return addAnnotation(state, action.payload)

    case Actions.LAYERS_UPDATE_ANNOTATION:
      return updateAnnotation(state, action.payload.index, action.payload.annotation)

    case Actions.LAYERS_REMOVE_ANNOTATION:
      return removeAnnotation(state, action.payload)

    case Actions.LAYERS_SHOW_ANNOTATION_LIST:
      return setShowAnnotationsList(state, action.payload)

    case Actions.LAYERS_CLEAR_OLD_ANNOTATIONS:
      return clearOlderGeometries(state, 0, action.payload) // Always clear geometries from the 0th annotation collection

    default:
      return state
  }
}

export default mapLayersReducer
