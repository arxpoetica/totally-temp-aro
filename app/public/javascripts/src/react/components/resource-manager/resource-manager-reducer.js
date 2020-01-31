import Actions from '../../common/actions'
import WormholeFusionType from '../../../shared-utils/wormhole-fusion-type'

const defaultState = {
  managers: {},
  editingManager: null
}

function setResourceManagerDefinition (state, manager) {
  return { ...state,
    managers: { ...state.managers,
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

function setPrimarySpatialEdge (state, resourceManagerId, primarySpatialEdge) {
  // At this point we are assuming that the resource manager being edited is a fusion_manager
  return { ...state,
    managers: { ...state.managers,
      [resourceManagerId]: { ...state.managers[resourceManagerId],
        definition: { ...state.managers[resourceManagerId].definition,
          config: { ...state.managers[resourceManagerId].definition.config,
            primarySpatialEdge: primarySpatialEdge
          }
        }
      }
    }
  }
}

function setWormholeFuseDefinition (state, resourceManagerId, spatialEdgeType, wormholeFusionTypeId) {
  // At this point we are assuming that the resource manager being edited is a fusion_manager
  var newState = { ...state,
    managers: { ...state.managers,
      [resourceManagerId]: { ...state.managers[resourceManagerId],
        definition: { ...state.managers[resourceManagerId].definition,
          config: { ...state.managers[resourceManagerId].definition.config,
            wormholeFuseDefinitions: { ...state.managers[resourceManagerId].definition.config.wormholeFuseDefinitions }
          }
        }
      }
    }
  }
  if (wormholeFusionTypeId === WormholeFusionType.none.id) {
    // We want to remove this spatial edge type from the state completely. No need to pass "none" to service.
    delete newState.managers[resourceManagerId].definition.config.wormholeFuseDefinitions[spatialEdgeType]
  } else {
    newState.managers[resourceManagerId].definition.config.wormholeFuseDefinitions[spatialEdgeType] = wormholeFusionTypeId
  }
  return newState
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

    case Actions.RESOURCE_MANAGER_SET_PRIMARY_SPATIAL_EDGE:
      return setPrimarySpatialEdge(state, action.payload.resourceManagerId, action.payload.primarySpatialEdge)

    case Actions.RESOURCE_MANAGER_SET_WORMHOLE_FUSE_DEFINITION:
      return setWormholeFuseDefinition(state, action.payload.resourceManagerId, action.payload.spatialEdgeType, action.payload.wormholeFusionTypeId)

    default:
      return state
  }
}

export default resourceManagerReducer
