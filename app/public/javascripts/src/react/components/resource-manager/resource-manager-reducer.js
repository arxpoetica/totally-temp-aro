import Actions from '../../common/actions'

const defaultState = {
  managers: {},
  editingManager: null
}

function setResourceManagerDefinition (state, resourceManagerId, definition) {
  return { ...state,
    managers: { ...state.manager,
      [resourceManagerId]: definition
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
      return setResourceManagerDefinition(state, action.payload.resourceManagerId, action.payload.definition)

    case Actions.RESOURCE_MANAGER_SET_EDITING_MANAGER:
      return setResourceManagerEditing(state, action.payload.id, action.payload.type)

    case Actions.RESOURCE_MANAGER_CLEAR_ALL:
      return JSON.parse(JSON.stringify(defaultState))

    default:
      return state
  }
}

export default resourceManagerReducer
