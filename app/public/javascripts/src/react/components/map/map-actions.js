/* globals */
import Actions from '../../common/actions'

function setGoogleMapsReference (googleMapsReference) {
  return dispatch => {
    dispatch({
      type: Actions.MAP_SET_GOOGLE_MAPS_REFERENCE,
      payload: googleMapsReference
    })
    // Set up an event handler so that the redux map zoom stays in sync with the google maps object
    googleMapsReference.addListener('zoom_changed', () => {
      dispatch({
        type: Actions.MAP_SET_ZOOM,
        payload: googleMapsReference.getZoom()
      })
    })
  }
}

function setSelectedMapFeatures (features) {
  return {
    type: Actions.MAP_SET_SELECTED_FEATURES,
    payload: features
  }
}

function requestSetMapCenter (mapCenter) {
  return {
    type: Actions.MAP_SET_REQUEST_SET_MAP_CENTER,
    payload: mapCenter
  }
}

function setAreTilesRendering (value) {
  return {
    type: Actions.MAP_SET_ARE_TILE_RENDERING,
    payload: value
  }
}

export default {
  setGoogleMapsReference,
  setSelectedMapFeatures,
  requestSetMapCenter,
  setAreTilesRendering,
}
