import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'

function saveResourceManagerDefinition (resourceManagerId, managerType, definition) {
  return dispatch => {
    AroHttp.put(`/service/v2/resource-manager/${resourceManagerId}/${managerType}`, definition)
      .catch(err => console.error(err))
  }
}

function startEditingResourceManager (resourceManagerId, managerType) {
  return dispatch => {
    AroHttp.get(`/service/v2/resource-manager/${resourceManagerId}/${managerType}`)
      .then(result => {
        dispatch({
          type: Actions.RESOURCE_MANAGER_SET_MANAGER_DEFINITION,
          payload: {
            resourceManagerId: resourceManagerId,
            definition: result.data
          }
        })
        dispatch({
          type: Actions.RESOURCE_MANAGER_SET_EDITING_MANAGER,
          payload: {
            id: resourceManagerId,
            type: managerType
          }
        })
      })
      .catch(err => console.error(err))
  }
}

function clearResourceManagers () {
  return {
    type: Actions.RESOURCE_MANAGER_CLEAR_ALL
  }
}

function setConnectivityDefinition (resourceManagerId, spatialEdgeType, networkConnectivityType) {
  // At this point we are assuming that the resource manager being edited is a fusion_manager
  return {
    type: Actions.RESOURCE_MANAGER_SET_CONNECTIVITY_DEFINITION,
    payload: {
      resourceManagerId,
      spatialEdgeType,
      networkConnectivityType
    }
  }
}

export default {
  startEditingResourceManager,
  saveResourceManagerDefinition,
  clearResourceManagers,
  setConnectivityDefinition
}
