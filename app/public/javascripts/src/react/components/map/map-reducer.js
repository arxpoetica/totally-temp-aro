import Actions from '../../common/actions'
import FeatureSets from '../../common/featureSets'

const defaultState = {
  googleMaps: null,
  zoom: 0,
  selectedFeatures: new FeatureSets(),
  areTilesRendering: false,
}

function setGoogleMapsReference (state, googleMapsReference) {
  return { ...state,
    googleMaps: googleMapsReference
  }
}

function setSelectedMapFeatures (state, features) {
  return { ...state,
    selectedFeatures: features
  }
}

function setZoom (state, zoom) {
  return { ...state,
    zoom
  }
}

function setRequestSetMapCenter (state, mapCenter) {
  return { ...state,
    mapCenter: mapCenter
  }
}

function configurationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.MAP_SET_GOOGLE_MAPS_REFERENCE:
      return setGoogleMapsReference(state, action.payload)

    case Actions.MAP_SET_SELECTED_FEATURES:
      return setSelectedMapFeatures(state, action.payload)

    case Actions.MAP_SET_ZOOM:
      return setZoom(state, action.payload)

    case Actions.MAP_SET_REQUEST_SET_MAP_CENTER:
      return setRequestSetMapCenter(state, action.payload) 

    case Actions.MAP_SET_ARE_TILE_RENDERING:
      return { ...state, areTilesRendering: action.payload }

    default:
      return state
  }
}

export default configurationReducer
