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

export default {
  setShowLocationLabels,
  deleteLocationWithId,
}
