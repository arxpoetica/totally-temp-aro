import Actions from '../../common/actions'

function setShowLocationLabels (showLocationLabels) {
  return {
    type: Actions.VIEW_SETTINGS_SET_SHOW_LOCATION_LABELS,
    payload: showLocationLabels
  }
}

function deleteLocationWithId (objectId) {
  return {
    type: Actions.VIEW_SETTINGS_DELETE_LOCATION_WITH_ID,
    payload: objectId
  }
}

function selectServiceArea (objectId) {
  return {
    type: Actions.VIEW_SETTINGS_SELECT_SERVICE_AREA,
    payload: objectId
  }
}

function editServiceArea (mapObject) {
  return {
    type: Actions.VIEW_SETTINGS_EDIT_SERVICE_AREA,
    payload: mapObject
  }
}

function deleteServiceArea (objectId) {
  return {
    type: Actions.VIEW_SETTINGS_DELETE_SERVICE_AREA,
    payload: objectId
  }
}

export default {
  setShowLocationLabels,
  deleteLocationWithId,
  selectServiceArea,
  editServiceArea,
  deleteServiceArea,
}
