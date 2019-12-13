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

function setConnectivityDefinition (state, resourceManagerId, spatialEdgeType, networkConnectivityType) {
  // At this point we are assuming that the resource manager being edited is a fusion_manager
  return { ...state,
    managers: { ...state.managers,
      [resourceManagerId]: { ...state.managers[resourceManagerId],
        definition: { ...state.managers[resourceManagerId].definition,
          config: { ...state.managers[resourceManagerId].definition.config,
            connectivityDefinition: { ...state.managers[resourceManagerId].definition.config.connectivityDefinition,
              [spatialEdgeType]: networkConnectivityType
            }
          }
        }
      }
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

    case Actions.RESOURCE_MANAGER_SET_CONNECTIVITY_DEFINITION:
      return setConnectivityDefinition(state, action.payload.resourceManagerId, action.payload.spatialEdgeType, action.payload.networkConnectivityType)

    default:
      return state
  }
}

export default resourceManagerReducer
