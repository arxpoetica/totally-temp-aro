import { List } from 'immutable'
import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'
import { hsvToRgb } from '../../common/view-utils'
import tileIcons from '../common/tile-overlay/tile-icons'
import mapDataActions from '../common/tile-overlay/map-data-actions'
import { klona } from 'klona'
import { batch } from 'react-redux'

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
        // TODO: filter UI isn't tied to state, F!
        if (newVisibility) dispatch( updateMapLayerFilters("near_net", "location_filters", {"multiSelect":[]}) )
      }
    }
  }
}

function turnOffAllLocations () {
  return (dispatch, getState) => {
    let locationLayers = getState().mapLayers.location
    batch(() => {
      locationLayers.forEach(layer => {
        dispatch(setLayerVisibility(layer, false))
      })
    })
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

// --- utility make these a utility? --- //
function _filterMultiselect (filter, val) {
  //if (!filter.multiSelect.length) return true
  return filter.multiSelect.includes(val)
}

function _filterMultiInput (filter, val) {
  //if (!filter.multiInput.length) return true
  return filter.multiInput.includes(val)
}
// note: all on the range filters are inclusive
function _filterRange (filter, val) {
  return (
    (filter.noMin || filter.rangeThreshold[0] <= val)
    && 
    (filter.noMax || val <= filter.rangeThreshold[1])
  )
}

function _filterMax (filter, val) {
  return filter.noMax || val <= filter.threshold
}

function _filterMin (filter, val) {
  return filter.noMin || filter.rangeThreshold[0] <= val
} 

const nearnetFilterProps = {
  // "location_filters": {
  //   "type": "MULTISELECT",
  //   "filterFunc": _filterMultiselect,
  // },
  "employee_count": {
    "type": "RANGE",
    "filterFunc": _filterRange,
  },
  "month_rev": {
    "type": "RANGE",
    "filterFunc": _filterRange,
  },
  "fair_share": {
    "type": "RANGE",
    "filterFunc": _filterRange,
  },
  "num_of_comp": {
    "type": "RANGE_MAX",
    "filterFunc": _filterMax,
  },
  "current_customer": {
    "type": "MULTISELECT",
    "filterFunc": _filterMultiselect,
  },
  "lit_build": {
    "type": "MULTISELECT",
    "filterFunc": _filterMultiselect,
  },
  // "industry": {
  //   "type": "MULTIINPUT",
  //   "filterFunc": _filterMultiInput,
  // },
  "industry": {
    "type": "MULTISELECT",
    "filterFunc": _filterMultiselect,
  },
  "entity_type": {
    "type": "MULTISELECT",
    "filterFunc": _filterMultiselect,
  },
}

// helper, maybe make a utility
function _filterEntitiesByProps (set, filters) {
  var filteredSets = {
    'nearnet': {},
    'excluded': {}
  }

  for (const [id, entity] of Object.entries(set)) {
    var doInclude = true
    
    for (const [propName, filter] of Object.entries(filters)) {
      if (
        doInclude
        && (propName in entity)
        && (propName in nearnetFilterProps)
      ) {
        doInclude = doInclude && nearnetFilterProps[propName].filterFunc(filter, entity[propName])
      }
    }

    if (doInclude && entity.plannedType in filteredSets) {
      filteredSets[entity.plannedType][id] = entity
    }
  }

  return filteredSets
}

function updateMapLayerFilters (layer, key, value) {
  return (dispatch, getState) => {
    // TODO: refilters
    if ('near_net' === layer) { // we shouldn't need to run this when key: location_filters
      const state = getState()
      const nearnetLocations = state.mapData.entityData.nearnet // defaults to {} so iterating thorugh it will return immediately 
      let newNearnetFilters = klona(state.mapLayers.filters.near_net)
      if (!newNearnetFilters) newNearnetFilters = {}
      if (key) newNearnetFilters[key] = value // TODO: I don't like this approach, we should be doing this after state updates - we're making assumption about how the reducer updates state
      // refilter nearnet locations state.mapData.entityData.nearnet
      //  by the filter values into 
      //  state.mapData.tileData.nearnet.nearnet
      //  and state.mapData.tileData.nearnet.excluded
      //  OR should that happen in a component? (reducer doesn't work cause that shouldn't have side effects)
      let filteredSets = _filterEntitiesByProps(nearnetLocations, newNearnetFilters)
      
      batch(() => {
        dispatch(mapDataActions.batchSetNearnetTileData(filteredSets))
        if ( // not a fan of this FIX later
          layer === "near_net"
          && key === "location_filters"
          && value.multiSelect.length
        ) {
          dispatch(turnOffAllLocations())
        }
      })
    }
    if (key) {
      dispatch({
        type: Actions.LAYERS_SET_MAP_FILTERS,
        payload: { layer, key, value }
      })
    }
  }
}

export default {
  setLayerVisibility,
  turnOffAllLocations,
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
  setMapReadyPromise,
  updateMapLayerFilters
}
