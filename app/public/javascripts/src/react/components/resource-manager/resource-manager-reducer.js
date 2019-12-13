import Actions from '../../common/actions'

const defaultState = {
  managers: {},
  editingManager: null
}

function setResourceManagerDefinition (state, manager) {
  return { ...state,
    managers: { ...state.manager,
      [manager.resourceManagerId]: manager
    }
  }
}

function setResourceManagerEditing (state, id, type) {
  return { ...state,
    editingManager: {
      id,
      type
    }
  }
}

function resourceManagerReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.RESOURCE_MANAGER_SET_MANAGER_DEFINITION:
      return setResourceManagerDefinition(state, action.payload)

    case Actions.RESOURCE_MANAGER_SET_EDITING_MANAGER:
      return setResourceManagerEditing(state, action.payload.id, action.payload.type)

    case Actions.RESOURCE_MANAGER_CLEAR_ALL:
      return JSON.parse(JSON.stringify(defaultState))

    default:
      return state
  }
}

export default resourceManagerReducer
