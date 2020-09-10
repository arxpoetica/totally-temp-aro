import Actions from '../../common/actions'

function setShowLocationLabels (showLocationLabels) {
  return {
    type: Actions.VIEW_SETTINGS_SET_SHOW_LOCATION_LABELS,
    payload: showLocationLabels
  }
}

export default {
  setShowLocationLabels
}
