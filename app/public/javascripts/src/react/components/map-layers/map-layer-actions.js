import { List } from 'immutable'
import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'
import { hsvToRgb } from '../../common/view-utils'
import tileIcons from '../common/tile-overlay/tile-icons'

// Sets the visibility for a specified layer
// ToDo: LOCATIONS refactor callers of this to send layer Key instead of whole layer
function setLayerVisibility (layer, newVisibility) {
  // if location send to Optimization
  return (dispatch, getState) => {
    // find type of layer
    const state = getState().mapLayers
    var layerType = null
    const list = ['location', 'constructionSite', 'boundary']
    list.forEach(key => {
      const layers = state[key]
      layers.forEach((stateLayer) => {
        if (stateLayer.key === layer.key && stateLayer.uiLayerId === layer.uiLayerId) {
          layerType = key
        }
      })
    })

    if (layerType !== null) {
      var setVisibilityByKey = {
        type: Actions.LAYERS_SET_VISIBILITY_BY_KEY,
        payload: {
          layerKeys: [
            {
              layerType: layerType,
              key: layer.key,
              uiLayerId: layer.uiLayerId,
              visibility: newVisibility
            }
          ]
        }
      }
      // I would like to get rid of the polymorphism
      // if (layer.analysisLayerId) setVisibilityByKey.analysisLayerId = layer.analysisLayerId

      // ToDo: use batch()
      dispatch(setVisibilityByKey)
      // if location send to Optimization
      if (layerType === 'location') {
        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_SET_LOCATION_TYPE,
          payload: {
            // TODO: potentially rewrite logic to use `layer.key`?
            // this is an older comment (from Brian?) that I've put back in place
            // as well as putting `layer.plannerKey` back too.
            // This was broken with the Map Tools React migration in this commit:
            // https://github.com/avco-aro/aro-app/pull/703/commits/1e5b106dee2c419330f57499f2ee6dfc603ec856#diff-296befdaf4359d3a66c6e6edfd9dad283b5fe6365e7988e432d9b1ef714b6199R48
            locationType: layer.plannerKey,
            isIncluded: newVisibility,
          }
        })
      }
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

function setCopperLayerVisibility (layerType, layer, newVisibility) {
  return {
    type: Actions.LAYERS_SET_COPPER_VISIBILITY,
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
  return dispatch => {
    dispatch({
      type: Actions.LAYERS_SET_CABLE_CONDUIT_VISIBILITY,
      payload: {
        cableKey: cableKey,
        conduitKey: conduitKey,
        visibility: newVisibility
      }
    })
  }
}

function setLocationTypes (locationTypes) {
  // set up map icons
  locationTypes.forEach(locType => {
    tileIcons.setIcon(locType.key, locType.iconUrl, {x:8, y:8})
  })

  return {
    type: Actions.LAYERS_SET_LOCATION,
    payload: locationTypes,
  }
}

function setLocationFilters (locationFilters) {
  return {
    type: Actions.LAYERS_SET_LOCATION_FILTERS,
    payload: locationFilters
  }
}

function setLocationFilterChecked (filterType, ruleKey, isChecked) {
  return {
    type: Actions.LAYERS_SET_LOCATION_FILTER_CHECKED,
    payload: {
      filterType,
      ruleKey,
      isChecked
    }
  }
}

function setNetworkEquipmentLayers (networkEquipmentLayers) {
  // set map icons 
  Object.values(networkEquipmentLayers.equipments).forEach(equipment => {
    // TODO: get offets
    tileIcons.setIcon(equipment.key, equipment.iconUrl, {x:8, y:8})
  })

  return {
    type: Actions.LAYERS_SET_NETWORK_EQUIPMENT,
    payload: networkEquipmentLayers
  }
}

function setConstructionAreaLayers (constructionAreaLayers) {
  return {
    type: Actions.LAYERS_SET_CONSTRUCTION_AREAS,
    payload: constructionAreaLayers
  }
}

function setConstructionSiteLayers (constructionSiteLayers) {
  return {
    type: Actions.LAYERS_SET_CONSTRUCTION_SITE,
    payload: constructionSiteLayers
  }
}

function setBoundaryLayers (boundaryLayers) {
  return dispatch => {
    // NOTE: trying to move away from the `immutability`
    // library, hence this deconstruction for future removal
    const layersClone = boundaryLayers.toJS()

    const ids = [...new Set(layersClone.map(layer => layer.analysisLayerId))]
    const promises = ids.map(id => AroHttp.get(`/service/category_assignments/${id}`))

    return Promise.all(promises).then(results => {

      results = results.filter(result => result.data.length).map(result => result.data)
      const newBoundaryLayers = layersClone.map(layer => {
        const foundGroup = (results.find(group => group[0].analysisLayerId === layer.analysisLayerId) || [])

        layer.categories = {}
        for (const group of foundGroup) {
          const tagsById = {}
          for (const tag of group.category.tags) {
            tag.colourHash = hsvToRgb(tag.colourHue, 1, 1)
            tagsById[tag.id] = tag
          }
          group.category.tags = tagsById
          group.category.analysisLayerId = group.analysisLayerId
          layer.categories[group.category.id] = group.category
        }

        return layer
      })

      dispatch({
        type: Actions.LAYERS_SET_BOUNDARY,
        // NOTE: trying to move away from the `immutability`
        // library, hence this reconstruction. In the future
        // won't need the `List` wrapper
        payload: List(newBoundaryLayers),
      })
    })
    .catch(err => console.error(err))
  }
}

function setCopperLayers (copperLayers) {
  return {
    type: Actions.LAYERS_SET_COPPER,
    payload: copperLayers
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

function clearOlderAnnotations (numberToClear) {
  return {
    type: Actions.LAYERS_CLEAR_OLD_ANNOTATIONS,
    payload: numberToClear
  }
}

function setSelectedBoundaryType (selectedBoundaryType) {
  return {
    type: Actions.LAYERS_SET_SELECTED_BOUNDARY_TYPE,
    payload: selectedBoundaryType
  }
}

function setTypeVisibility (typeVisibility) {
  return {
    type: Actions.LAYERS_SET_TYPE_VISIBILITY,
    payload: typeVisibility
  }
}

function setShowSegmentsByTag(showSegmentsByTag) {
  return {
    type: Actions.LAYERS_SET_SHOW_SEGMENTS_BY_TAG,
    payload: showSegmentsByTag,
  }
}

function setEdgeConstructionTypeVisibility(constructionType, isVisible) {
  return {
    type: Actions.LAYERS_SET_EDGE_CONSTRUCTION_TYPE_VISIBILITY,
    payload: {constructionType, isVisible},
  }
}

function loadEdgeConstructionTypeIds() {
  return dispatch => {
    AroHttp.get('/service/odata/EdgeConstructionTypeEntity')
      .then(result => dispatch({
        type: Actions.LAYERS_SET_EDGE_CONSTRUCTION_TYPE_IDS,
        payload: result.data
      }))
      .catch(err => console.error(err))
  }
}

function setActiveMapLayers (activeMapLayers) {
  return {
    type: Actions.LAYERS_SET_ACTIVE_MAP_LAYERS,
    payload: activeMapLayers
  }
}

function setAngularMapLayerSubject (mapLayers) {
  return {
    type: Actions.LAYERS_SET_ANGULAR_MAP_LAYER_SUBSCRIBER,
    payload: mapLayers
  }
}

function setMapReadyPromise (mapReadyPromise) {
  return {
    type: Actions.LAYERS_SET_MAP_READY_PROMISE,
    payload: mapReadyPromise
  }
}

export default {
  setLayerVisibility,
  setNetworkEquipmentLayerVisibility,
  setNetworkEquipmentSubtypeVisibility,
  setCableConduitVisibility,
  setLocationTypes,
  setLocationFilters,
  setLocationFilterChecked,
  setNetworkEquipmentLayers,
  setConstructionAreaLayers,
  setConstructionSiteLayers,
  setBoundaryLayers,
  setCopperLayers,
  setCopperLayerVisibility,
  setShowSiteBoundary,
  loadAnnotationsForUser,
  saveAnnotationsForUser,
  addAnnotation,
  updateAnnotation,
  removeAnnotation,
  clearOlderAnnotations,
  setSelectedBoundaryType,
  setTypeVisibility,
  setShowSegmentsByTag,
  setEdgeConstructionTypeVisibility,
  loadEdgeConstructionTypeIds,
  setActiveMapLayers,
  setAngularMapLayerSubject,
  setMapReadyPromise
}
