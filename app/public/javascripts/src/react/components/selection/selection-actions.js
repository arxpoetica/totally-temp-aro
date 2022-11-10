import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'
import { Notifier } from '../../common/notifications'
import WktUtils from '../../../shared-utils/wkt-utils'
import MenuItemFeature from '../context-menu/menu-item-feature'
import MenuItemAction from '../context-menu/menu-item-action'
import ContextMenuActions from '../context-menu/actions'
import { tileCaches } from '../common/tile-overlay/tile-cache'
import TileUtils from '../common/tile-overlay/tile-overlay-utils'


function setActiveSelectionMode (selectionModeId) {
  return {
    type: Actions.SELECTION_SET_ACTIVE_MODE,
    payload: selectionModeId
  }
}

function clearAllPlanTargets () {
  return { type: Actions.SELECTION_CLEAR_ALL_PLAN_TARGETS }
}

function loadPlanTargetSelectionsFromServer (planId) {
  return dispatch => {
    // First clear all selections
    dispatch(clearAllPlanTargets())
    // Then get selections from the server
    var selectionPromises = [
      AroHttp.get(`/service/plan/${planId}/selected_locations`),
      AroHttp.get(`/service_areas/${planId}/selectedServiceAreaIds`),
      AroHttp.get(`/analysis_areas/${planId}/selectedAnalysisAreaIds`)
    ]

    Promise.all(selectionPromises)
      .then(results => {
        const planTargets = {
          locations: results[0].data,
          serviceAreas: results[1].data.map(item => +item.id),
          analysisAreas: results[2].data.map(item => +item.id),
          allServiceAreas: []
        }
        dispatch(addPlanTargets(planId, planTargets))
      })
      .catch(err => Notifier.error(err))
  }
}

function addPlanTargets (planId, planTargets) {
  return dispatch => {
    // Update client state
    dispatch({ type: Actions.SELECTION_ADD_PLAN_TARGETS, payload: planTargets })
    // Save targets on server
    if (planTargets.locations) {
      AroHttp.post(`/service/plan/selected_locations/cmd`, {
        'cmdType': 'ADD',
        'locationIds': Array.from(planTargets.locations),
        'planId': planId,
      }).catch(err => Notifier.error(err))
    }
    if (planTargets.serviceAreas) {
      AroHttp.post(`/service_areas/${planId}/addServiceAreaTargets`, { serviceAreaIds: Array.from(planTargets.serviceAreas) })
        .catch(err => Notifier.error(err))
    }
    if (planTargets.analysisAreas) {
      AroHttp.post(`/analysis_areas/${planId}/addAnalysisAreaTargets`, { analysisAreaIds: Array.from(planTargets.analysisAreas) })
        .catch(err => Notifier.error(err))
    }
    // Get descriptions for added plan targets, then save them to the client state
    var descriptionPromises = [
      AroHttp.post('/network_plan/targets/addresses', { locationIds: [...(planTargets.locations || [])] }),
      AroHttp.post('/network_plan/service_area/addresses', { serviceAreaIds: [...(planTargets.serviceAreas || [])] }),
      AroHttp.post('/network_plan/analysis_area/addresses', { analysisAreaIds: [...(planTargets.analysisAreas || [])] })
    ]
    Promise.all(descriptionPromises)
      .then(results => {
        // ToDo: use batch
        dispatch({
          type: Actions.SELECTION_ADD_PLAN_TARGET_DESCRIPTIONS,
          payload: {
            locations: results[0].data,
            serviceAreas: results[1].data,
            analysisAreas: results[2].data,
            allServiceAreas: []
          }
        })
        // turn on boundary layers for any new description that has an entry in planTargets
        // there is currently no way to turn on boundaries that aren't analysis layers, not enough infor from service
        var layerKeys = []
        var analysisLayerIds = []
        Object.keys(results[2].data).forEach(key => {
          var layer = results[2].data[key]
          if (!analysisLayerIds.includes(layer.analysis_layer_id) && planTargets.analysisAreas.includes(layer.id)) {
            analysisLayerIds.push(layer.analysis_layer_id)
            layerKeys.push({
              layerType: 'boundary',
              key: 'analysis_layer',
              analysisLayerId: layer.analysis_layer_id,
              visibility: true
            })
          }
        })

        if (layerKeys.length) {
          dispatch({
            type: Actions.LAYERS_SET_VISIBILITY_BY_KEY,
            payload: {
              layerKeys: layerKeys
            }
          })
        }
      })
      .catch(err => Notifier.error(err))
  }
}

function removePlanTargets (planId, planTargets) {
  return dispatch => {
    // Update client state
    dispatch({ type: Actions.SELECTION_REMOVE_PLAN_TARGETS, payload: planTargets })
    // Save targets on server
    if (planTargets.locations) {
      AroHttp.post(`/service/plan/selected_locations/cmd`, {
        'cmdType': 'REMOVE',
        'locationIds': Array.from(planTargets.locations),
        'planId': planId,
      }).catch(err => Notifier.error(err))
    }
    if (planTargets.serviceAreas) {
      AroHttp.post(`/service_areas/${planId}/removeServiceAreaTargets`, { serviceAreaIds: Array.from(planTargets.serviceAreas) })
        .catch(err => Notifier.error(err))
    }
    if (planTargets.analysisAreas) {
      AroHttp.post(`/analysis_areas/${planId}/removeAnalysisAreaTargets`, { analysisAreaIds: Array.from(planTargets.analysisAreas) })
        .catch(err => Notifier.error(err))
    }
  }
}

function setLocations (locationIds) {
  return {
    type: Actions.SELECTION_SET_LOCATIONS,
    payload: locationIds
  }
}

function setMapFeatures (mapFeatures) {
  return {
    type: Actions.SELECTION_SET_MAP_FEATURES,
    payload: mapFeatures
  }
}

function setRoadSegments(roadSegments) {
  return {
    type: Actions.SELECTION_SET_ROAD_SEGMENTS,
    payload: roadSegments,
  }
}

// DEPRICATED
function setPlanEditorFeatures (planEditorFeatures) {
  return {
    type: Actions.SELECTION_SET_PLAN_EDITOR_FEATURES,
    payload: planEditorFeatures
  }
}

function cloneSelection() {
  return (dispatch, getState) => {
    const state = getState()
    const { selection } = state.selection
    return {
      details: selection.details,
      editable: selection.editable
    }
  }
}

function setMapSelection (mapSelection) {
  return {
    type: Actions.SELECTION_SET_MAP_SELECTION,
    payload: mapSelection
  }
}

function setIsMapClicked (isMapClicked) {
  return {
    type: Actions.SELECTION_SET_IS_MAP_CLICKED,
    payload: isMapClicked
  }
}

function setSelectedMapObject(selectedMapObject) {
  return {
    type: Actions.SELECTION_SET_SELECTED_MAP_OBJECT,
    payload: selectedMapObject,
  }
}

function setObjectIdToMapObject(objectIdToMapObject) {
  return {
    type: Actions.SELECTION_SET_OBJECTID_TO_MAP_OBJECT,
    payload: objectIdToMapObject,
  }
}

function requestPolygonSelect(polygonCoordinates) {
  return {
    type: Actions.SELECTION_SET_POLYGON_COORDINATES,
    payload: polygonCoordinates,
  }
}

function selectNearnetEntities(nearnetEntities) {
  // TODO: clear ONLY effected tiles
  // TODO: not sure clear cache belongs here
  return (dispatch, getState) => {
    //TODO: fix this so we don't have to use the wholesale reset
    // console.log(tileCaches)

    const state = getState()
    let prevSelection = null
    if (state.selection.nearnetEntities.length) prevSelection = state.selection.nearnetEntities[0]
    // get world coords for prev point and next clear cache for both if exist
    let nextSelection = null
    if (nearnetEntities.length) nextSelection = nearnetEntities[0]
    for (const selection of [prevSelection, nextSelection]) {
      if (selection) {
        let worldCoord = TileUtils.latLngToWorldCoord(
          new google.maps.LatLng(selection.point.latitude, selection.point.longitude)
        )
        //tileCaches['nearnet']['nearnet'].deleteTilesForWorldCoord(worldCoord)
        //tileCaches['nearnet']['excluded'].deleteTilesForWorldCoord(worldCoord)
        for (let cache of Object.values(tileCaches['nearnet'])) {
          cache.deleteTilesForWorldCoord(worldCoord)
        }
      }
    }

    // for (let cache of Object.values(tileCaches['nearnet'])) {
    //   cache.clear()
    // }

    dispatch({
      type: Actions.SELECTION_SET_NEARNET_ENTITIES,
      payload: nearnetEntities, 
    })
  }
}

function nearnetContextMenu (features, event) {
  return (dispatch) => {
    var menuItemFeatures = []
    features.forEach(location => {
      let menuActions = []
      menuActions.push(new MenuItemAction('SELECT', 'Select', 'SelectionActions', 'selectNearnetEntities', [location]))
      menuItemFeatures.push(new MenuItemFeature('LOCATION', 'Location', menuActions))
    })

    if (menuItemFeatures.length <= 0) return Promise.resolve()
    const coords = WktUtils.getXYFromEvent(event)
    dispatch(ContextMenuActions.setContextMenuItems(menuItemFeatures))
    dispatch(ContextMenuActions.showContextMenu(coords.x, coords.y))
  }
}

export default {
  setActiveSelectionMode,
  clearAllPlanTargets,
  loadPlanTargetSelectionsFromServer,
  addPlanTargets,
  removePlanTargets,
  setLocations,
  setPlanEditorFeatures,
  setMapFeatures,
  setRoadSegments,
  cloneSelection,
  setMapSelection,
  setIsMapClicked,
  setSelectedMapObject,
  setObjectIdToMapObject,
  requestPolygonSelect,
  selectNearnetEntities,
  nearnetContextMenu,
}
