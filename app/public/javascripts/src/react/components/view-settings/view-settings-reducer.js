import Actions from '../../common/actions'

const defaultState = {
  showLocationLabels: false
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

    default:
      return state
  }
}

export default viewSettingsReducer
