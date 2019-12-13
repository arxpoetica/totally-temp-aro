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

function startEditingResourceManager (resourceManagerId, managerType) {
  return dispatch => {
    dispatch(loadResourceManagerDefinition(resourceManagerId, managerType))
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
