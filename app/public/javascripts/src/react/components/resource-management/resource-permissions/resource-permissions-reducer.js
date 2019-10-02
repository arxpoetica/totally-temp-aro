import Actions from '../../../common/actions'

const defaultState = {
  accessById: {}
}

function addAccessItem (state, resourceId, item) {
  var newAccessById = { ...state.accessById }
  newAccessById[resourceId] = item
  return { ...state,
    accessById: newAccessById
  }
}

function resourcePermissionsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.RESOURCE_PERMISSIONS_LOAD_ACCESS:
      return addAccessItem(state, action.payload.resourceId, action.payload.item)

    default:
      return state
  }
}

export default resourcePermissionsReducer
