import Actions from '../../common/actions'

const defaultState = {
  showLocationLabels: false,
  deletedLocationId: '',
  selectSAWithId: '',
  editSAWithId: '',
  deleteSAWithId: '',
  multiPolygonFeature: {},
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
    
    case Actions.VIEW_SETTINGS_SELECT_SERVICE_AREA:
      return { ...state, selectSAWithId: action.payload }

    case Actions.VIEW_SETTINGS_EDIT_SERVICE_AREA:
      return { ...state, editSAWithId: action.payload }

    case Actions.VIEW_SETTINGS_DELETE_SERVICE_AREA:
      return { ...state, deleteSAWithId: action.payload }

    case Actions.VIEW_SETTINGS_CREATE_MULTI_POLYGON:
      return { ...state, multiPolygonFeature: action.payload }

    default:
      return state
  }
}

export default viewSettingsReducer
