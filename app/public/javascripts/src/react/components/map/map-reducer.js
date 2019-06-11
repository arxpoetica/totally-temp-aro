import Actions from '../../common/actions'
import FeatureSets from '../../common/featureSets'

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

function configurationReducer (state = { googleMaps: null, selectedFeatures: new FeatureSets() }, action) {
  switch (action.type) {
    case Actions.MAP_SET_GOOGLE_MAPS_REFERENCE:
      return setGoogleMapsReference(state, action.payload)
    case Actions.MAP_SET_SELECTED_FEATURES:
      return setSelectedMapFeatures(state, action.payload)

    default:
      return state
  }
}

export default configurationReducer
