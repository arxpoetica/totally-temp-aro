import Actions from '../../common/actions'
import FeatureSets from '../../common/featureSets'

const defaultState = {
  googleMaps: null,
  isEnabled: true,
  selectedFeatures: new FeatureSets()
}

function setGoogleMapsReference (state, googleMapsReference) {
  return { ...state,
    googleMaps: googleMapsReference
  }
}

function setIsEnabled (state, isEnabled) {
  return { ...state,
    isEnabled: isEnabled
  }
}

function setSelectedMapFeatures (state, features) {
  return { ...state,
    selectedFeatures: features
  }
}

function configurationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.MAP_SET_GOOGLE_MAPS_REFERENCE:
      return setGoogleMapsReference(state, action.payload)

    case Actions.MAP_SET_ENABLED:
      return setIsEnabled(state, action.payload)

    case Actions.MAP_SET_SELECTED_FEATURES:
      return setSelectedMapFeatures(state, action.payload)

    default:
      return state
  }
}

export default configurationReducer
