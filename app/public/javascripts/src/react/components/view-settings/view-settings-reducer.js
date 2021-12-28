import Actions from '../../common/actions'

const defaultState = {
  showLocationLabels: false,
  deletedLocationId: '',
  selectServiceAreaWithId: '',
  editServiceAreaWithId: '',
  deleteServiceAreaWithId: '',
  multiPolygonFeature: {},
  isRecreateTiles: false,
  serviceAreaBoundaryDetails: {},
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
      return { ...state, selectServiceAreaWithId: action.payload }

    case Actions.VIEW_SETTINGS_EDIT_SERVICE_AREA:
      return { ...state, editServiceAreaWithId: action.payload }

    case Actions.VIEW_SETTINGS_DELETE_SERVICE_AREA:
      return { ...state, deleteServiceAreaWithId: action.payload }

    case Actions.VIEW_SETTINGS_CREATE_MULTI_POLYGON:
      return { ...state, multiPolygonFeature: action.payload }

    case Actions.VIEW_SETTINGS_IS_RECREATE_TILE_AND_CACHE:
      return { ...state, isRecreateTiles: action.payload }

    case Actions.VIEW_SETTINGS_SET_SERVICE_AREA_BOUNDARY_DETAILS:
      return { ...state, serviceAreaBoundaryDetails: action.payload }

    default:
      return state
  }
}

export default viewSettingsReducer
