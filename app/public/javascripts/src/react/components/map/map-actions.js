/* globals */
import Actions from '../../common/actions'

function setGoogleMapsReference(googleMapsReference) {
  return (dispatch) => {
    dispatch({
      type: Actions.MAP_SET_GOOGLE_MAPS_REFERENCE,
      payload: googleMapsReference,
    })
    // Set up an event handler so that the redux map zoom stays in sync with the google maps object
    googleMapsReference.addListener('zoom_changed', () => {
      dispatch({
        type: Actions.MAP_SET_ZOOM,
        payload: googleMapsReference.getZoom(),
      })
    })
  }
}

function setSelectedMapFeatures(features) {
  return {
    type: Actions.MAP_SET_SELECTED_FEATURES,
    payload: features,
  }
}

function requestSetMapCenter(mapCenter) {
  return {
    type: Actions.MAP_SET_REQUEST_SET_MAP_CENTER,
    payload: mapCenter,
  }
}

function setMapTools(mapTools) {
  return {
    type: Actions.MAP_SET_MAP_TOOLS,
    payload: mapTools,
  }
}


function setLocationLayerState(locationStateObject) {
  return {
    type: Actions.MAP_SET_LOCATION_LAYER_STATE,
    payload: locationStateObject,
  }
}

function setAreTilesRendering (value) {
  return {
    type: Actions.MAP_SET_ARE_TILES_RENDERING,
    payload: value
  }
}

export default {
  setGoogleMapsReference,
  setSelectedMapFeatures,
  requestSetMapCenter,
  setMapTools,
  setLocationLayerState,
  setAreTilesRendering,
}
