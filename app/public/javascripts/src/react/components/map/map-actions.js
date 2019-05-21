/* globals */
import Actions from '../../common/actions'

function setGoogleMapsReference (googleMapsReference) {
  return {
    type: Actions.MAP_SET_GOOGLE_MAPS_REFERENCE,
    payload: googleMapsReference
  }
}

export default {
  setGoogleMapsReference: setGoogleMapsReference
}
