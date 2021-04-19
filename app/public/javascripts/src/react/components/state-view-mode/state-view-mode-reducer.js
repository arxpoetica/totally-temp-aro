import Actions from '../../common/actions'

const defaultState = {
  entityTypeList: {
    LocationObjectEntity: [],
    NetworkEquipmentEntity: [],
    ServiceAreaView: [],
    CensusBlocksEntity: [],
    AnalysisArea: [],
    AnalysisLayer: []
  },
  entityTypeBoundaryList: [], // list of matched boundary list (ServiceAreaView/CensusBlocksEntity/AnalysisArea)
  layerCategories: {},
  isClearViewMode: false,
}

function setEntityTypeList (state, entityTypeList) {
  return { ...state,
    entityTypeList: entityTypeList
  }
}

function setEntityTypeBoundaryList (state, entityTypeBoundaryList) {
  return { ...state,
    entityTypeBoundaryList: entityTypeBoundaryList
  }
}

function setLayerCategories (state, layerCategories) {
  return { ...state,
    layerCategories: layerCategories
  }
}

function setClearViewMode (state, isClearViewMode) {
  return { ...state,
    isClearViewMode: isClearViewMode
  }
}

function configurationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.STATE_VIEW_MODE_GET_ENTITY_TYPE_LIST:
      return setEntityTypeList(state, action.payload)

    case Actions.STATE_VIEW_MODE_GET_ENTITY_TYPE_BOUNDRY_LIST:
      return setEntityTypeBoundaryList(state, action.payload)

    case Actions.STATE_VIEW_MODE_SET_LAYER_CATEGORIES:
      return setLayerCategories(state, action.payload)

    case Actions.STATE_VIEW_MODE_CLEAR_VIEW_MODE:
      return setClearViewMode(state, action.payload)

    default:
      return state
  }
}

export default configurationReducer
