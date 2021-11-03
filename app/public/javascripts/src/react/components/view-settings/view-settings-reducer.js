import Actions from '../../common/actions'

const defaultState = {
  showLocationLabels: false,
  deletedLocationId: '',
}

function setShowLocationLabels (state, showLocationLabels) {
  return { ...state,
    showLocationLabels
  }
}

function viewSettingsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.VIEW_SETTINGS_SET_SHOW_LOCATION_LABELS:
      return setShowLocationLabels(state, action.payload)

    case Actions.VIEW_SETTINGS_DELETE_LOCATION_WITH_ID:
      return { ...state, deletedLocationId: action.payload }

    default:
      return state
  }
}

export default viewSettingsReducer
