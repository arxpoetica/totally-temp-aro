import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'

function getAcl (resourceType, resourceId, doForceUpdate = false) {
  return (dispatch, getState) => {
    const state = getState()
    // use cached version if we have one, unless force refresh
    if (doForceUpdate ||
      !state.acl.aclByType.hasOwnProperty(resourceType) ||
      !state.acl.aclByType[resourceType].hasOwnProperty(resourceId)) {
      AroHttp.get(`/service/auth/acl/${resourceType}/${resourceId}`)
        .then(result => {
          dispatch({
            type: Actions.ACL_SET_ACL,
            payload: {
              resourceType: resourceType,
              resourceId: resourceId,
              acl: result.data.resourcePermissions
            }
          })
        }).catch(err => console.error(err))
    }
  }
}

function putAcl (resourceType, resourceId, acl) {
  return (dispatch) => {
    AroHttp.put(`/service/auth/acl/${resourceType}/${resourceId}`, { 'resourcePermissions': acl })
      .then(result => {
        // wait for success before updating local state, keep in sync
        dispatch({
          type: Actions.ACL_SET_ACL,
          payload: {
            resourceType: resourceType,
            resourceId: resourceId,
            acl: acl
          }
        })
      }).catch(err => console.error(err))
  }
}
// make add user fn that ensures user is not already in list then calls setUser
function setUserAcl (resourceType, resourceId, userId, permissionsBit) {
  return (dispatch, getState) => {
    const state = getState()
    var acl = state.acl.aclByType[resourceType][resourceId].slice(0)
    var authItem = acl.find(item => item.systemActorId === userId)
    if (authItem) {
      authItem.rolePermissions = permissionsBit
    } else {
      acl.push({
        'systemActorId': userId,
        'rolePermissions': permissionsBit
      })
    }

    dispatch(putAcl(resourceType, resourceId, acl))
  }
}

function deleteUserAcl (resourceType, resourceId, userId) {
  return (dispatch, getState) => {
    const state = getState()
    var acl = state.acl.aclByType[resourceType][resourceId].filter(item => item.systemActorId !== userId)

    dispatch(putAcl(resourceType, resourceId, acl))
  }
}

export default {
  getAcl,
  putAcl,
  setUserAcl,
  deleteUserAcl
}
