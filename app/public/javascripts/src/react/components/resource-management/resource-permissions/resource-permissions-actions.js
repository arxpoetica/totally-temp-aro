import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'

function loadResourceAccess (resourceType, resourceId, doForceUpdate = false) {
  return (dispatch, getState) => {
    const state = getState()
    if (state.resourcePermissions.accessById && (doForceUpdate || !state.resourcePermissions.accessById.hasOwnProperty(resourceId))) {
      AroHttp.get(`/service/auth/acl/${resourceType}/${resourceId}`)
        .then(result => {
          console.log(result)
          dispatch({
            type: Actions.RESOURCE_PERMISSIONS_LOAD_ACCESS,
            payload: {
              resourceId: resourceId,
              item: result.data.resourcePermissions
            }
          })
        }).catch(err => console.error(err))
    }
  }
}

export default {
  loadResourceAccess
}
