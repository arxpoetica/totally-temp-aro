/* globals */
import Actions from '../../common/actions'

function setGoogleMapsReference (googleMapsReference) {
  return {
    type: Actions.MAP_SET_GOOGLE_MAPS_REFERENCE,
    payload: googleMapsReference
  }
}

function setIsMapEnabled (isEnabled) {
  return {
    type: Actions.MAP_SET_ENABLED,
    payload: isEnabled
  }
}

function setSelectedMapFeatures (features) {
  return {
    type: Actions.MAP_SET_SELECTED_FEATURES,
    payload: features
  }
}

export default {
  setGoogleMapsReference,
  setIsMapEnabled,
  setSelectedMapFeatures
}
