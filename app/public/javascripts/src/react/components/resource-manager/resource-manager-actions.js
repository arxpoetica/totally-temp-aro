import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'

function loadResourceManagerDefinition (resourceManagerId, managerType) {
  return dispatch => {
    AroHttp.get(`/service/v2/resource-manager/${resourceManagerId}/${managerType}`)
      .then(result => dispatch({
        type: Actions.RESOURCE_MANAGER_SET_MANAGER_DEFINITION,
        payload: {
          resourceManagerId: resourceManagerId,
          definition: result.data
        }
      }))
      .catch(err => console.error(err))
  }
}

function mockLoadResourceManagerDefinition (resourceManagerId, managerType) {
  // Using this for now since service is throwing some kind of exception
  return dispatch => {
    dispatch({
      type: Actions.RESOURCE_MANAGER_SET_MANAGER_DEFINITION,
      payload: {
        resourceManagerId: resourceManagerId,
        definition: {
          cellNodeConstraints: {
            placementStrategy: 'EXISTING_AND_RANDOM',
            cellRadius: 300,
            cellGranularityRatio: 0.5,
            minimumRayLength: 45.0,
            snappingDistanceMeters: 50,
            polygonStrategy: 'FIXED_RADIUS'
          },
          dslamNodeConstraints: {
            placementStrategy: 'EXISTING_AND_RANDOM',
            cellRadius: 300,
            cellGranularityRatio: 0.5,
            snappingDistanceMeters: 120,
            optimizationSpeedMbs: 10
          },
          fiberRoutingMode: 'ROUTE_FROM_NODES',
          inferCoWhenMissing: true,
          fiberBufferSize: 152.4,
          maxLocationDistanceToEdge: 500,
          maxEquipmentDistanceToEdge: 300,
          edgeBufferDistance: 300
        }
      }
    })
  }
}

function startEditingResourceManager (resourceManagerId, managerType) {
  return dispatch => {
    dispatch(mockLoadResourceManagerDefinition(resourceManagerId, managerType))
    dispatch({
      type: Actions.RESOURCE_MANAGER_SET_EDITING_MANAGER,
      payload: {
        id: resourceManagerId,
        type: managerType
      }
    })
  }
}

function clearResourceManagers () {
  return {
    type: Actions.RESOURCE_MANAGER_CLEAR_ALL
  }
}

export default {
  startEditingResourceManager,
  clearResourceManagers
}
