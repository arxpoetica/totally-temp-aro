import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'

function saveResourceManagerDefinition (resourceManagerId, managerType, definition) {
  return (dispatch, getState) => {
    AroHttp.put(`/service/v2/resource-manager/${resourceManagerId}/${managerType}`, definition)
      .then(response => {
        const state = getState()
        // update store with information coming back from call
        dispatch({
          type: Actions.RESOURCE_MANAGER_SET_MANAGER_DEFINITION,
          payload: {
            resourceManagerId: resourceManagerId,
            resourceManagerName: state.resourceManager.managers[resourceManagerId].resourceManagerName,
            definition: response.data
          }
        })
      })
      .catch(err => console.error(err))
  }
}

function setEditingMode (editingMode) {
  return {
    type: Actions.RESOURCE_MANAGER_SET_EDITING_MODE,
    payload: {
      editingMode: editingMode
    }
  }
}

function startEditingResourceManager (resourceManagerId, managerType, resourceManagerName, editingMode) {
  return dispatch => {
    AroHttp.get(`/service/v2/resource-manager/${resourceManagerId}/${managerType}`)
      .then(result => {
        // ToDo: use batch here (once merged with refactor branch)
        dispatch({
          type: Actions.RESOURCE_MANAGER_SET_MANAGER_DEFINITION,
          payload: {
            resourceManagerId: resourceManagerId,
            resourceManagerName: resourceManagerName,
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
        dispatch({
          type: Actions.RESOURCE_MANAGER_SET_EDITING_MODE,
          payload: {
            editingMode: editingMode
          }
        })
      })
      .catch(err => {
        console.error(err)
        swal({
          title: 'Failed to load resource manager',
          text: `ARO-Service returned status code ${err.status}`,
          type: 'error'
        })
      })
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

function setPrimarySpatialEdge (resourceManagerId, primarySpatialEdge) {
  // At this point we are assuming that the resource manager being edited is a fusion_manager
  return {
    type: Actions.RESOURCE_MANAGER_SET_PRIMARY_SPATIAL_EDGE,
    payload: {
      resourceManagerId,
      primarySpatialEdge
    }
  }
}

function setWormholeFuseDefinition (resourceManagerId, spatialEdgeType, wormholeFusionTypeId) {
  // At this point we are assuming that the resource manager being edited is a fusion_manager
  return {
    type: Actions.RESOURCE_MANAGER_SET_WORMHOLE_FUSE_DEFINITION,
    payload: {
      resourceManagerId,
      spatialEdgeType,
      wormholeFusionTypeId
    }
  }
}

export default {
  startEditingResourceManager,
  setEditingMode,
  saveResourceManagerDefinition,
  clearResourceManagers,
  setConnectivityDefinition,
  setPrimarySpatialEdge,
  setWormholeFuseDefinition
}
