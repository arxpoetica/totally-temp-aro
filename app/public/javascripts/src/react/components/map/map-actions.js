/* globals */
import Actions from '../../common/actions'

function setGoogleMapsReference (googleMapsReference) {
  return {
    type: Actions.MAP_SET_GOOGLE_MAPS_REFERENCE,
    payload: googleMapsReference
  }
}

function setSelectedMapFeatures (features) {
  return {
    type: Actions.MAP_SET_SELECTED_FEATURES,
    payload: features
  }
}

export default {
  setGoogleMapsReference: setGoogleMapsReference, 
  setSelectedMapFeatures: setSelectedMapFeatures
}
