import Actions from '../../common/actions'

function setGoogleMapsReference (state, googleMapsReference) {
  return { ...state,
    googleMaps: googleMapsReference
  }
}

function configurationReducer (state = { googleMaps: null }, action) {
  switch (action.type) {
    case Actions.MAP_SET_GOOGLE_MAPS_REFERENCE:
      return setGoogleMapsReference(state, action.payload)

    default:
      return state
  }
}

export default configurationReducer
