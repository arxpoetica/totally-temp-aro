import fetch from 'cross-fetch'
import Actions from '../../common/actions'
import Constants from '../../../components/common/constants'

const PERMISSIONS = Object.freeze({
  READ: 'READ',
  WRITE: 'WRITE',
  ADMIN: 'ADMIN',
  IS_SUPERUSER: 'IS_SUPERUSER'
})

function getPermissionBits() {
  // Get the permission bits from aro-service
  const accessTypes = Object.freeze({
    RESOURCE_READ: { displayName: 'Read', permissionBits: null },
    RESOURCE_WRITE: { displayName: 'Write', permissionBits: null },
    RESOURCE_ADMIN: { displayName: 'Owner', permissionBits: null }
  })

  return fetch('/service/auth/permissions')
    .then(response => response.json(), err => console.log(err))
    .then(result => {
      result.forEach((authPermissionEntity) => {
        if (accessTypes.hasOwnProperty(authPermissionEntity.name)) {
          accessTypes[authPermissionEntity.name].permissionBits = authPermissionEntity.id
        }
      })
      return Promise.resolve(accessTypes)
    })
  .catch(err => console.log(err))
}

// Gets the effective permissions for a given resourceType (e.g. PLAN, SYSTEM) and resourceId (e.g. plan id, user id)
function getEffectivePermissions(resourceType, resourceId, loggedInUser) {
  return Promise.all([
    getPermissionBits(),
    fetch(`/service/auth/acl/${resourceType}/${resourceId}`),
    fetch(`/service/auth/acl/SYSTEM/${loggedInUser.id}`)
  ])
    .then((results) => Promise.all([Promise.resolve(results[0]), results[1].json(), results[2].json()]))
    .then((results) => {
      const resolvedAccessTypes = results[0]
      const resourcePermissions = results[1], systemPermissions = results[2]

      var accessResult = {}
      accessResult[PERMISSIONS.READ] = false
      accessResult[PERMISSIONS.WRITE] = false
      accessResult[PERMISSIONS.ADMIN] = false
      accessResult[PERMISSIONS.IS_SUPERUSER] = false

      // We are checking if the logged in user or any of the users groups have permission to write.
      resourcePermissions.resourcePermissions.forEach((access) => {
        if ((loggedInUser.id === access.systemActorId) || (loggedInUser.groupIds.indexOf(access.systemActorId) >= 0)) {
          const permission = access.rolePermissions
          // Note the or-equal-to (|=). So we start out with no permissions, and keep adding to them.
          accessResult[PERMISSIONS.READ] = accessResult[PERMISSIONS.READ] || ((permission & resolvedAccessTypes.RESOURCE_READ.permissionBits) != 0)
          accessResult[PERMISSIONS.WRITE] = accessResult[PERMISSIONS.WRITE] || ((permission & resolvedAccessTypes.RESOURCE_WRITE.permissionBits) != 0)
          accessResult[PERMISSIONS.ADMIN] = accessResult[PERMISSIONS.ADMIN] || ((permission & resolvedAccessTypes.RESOURCE_ADMIN.permissionBits) != 0)
        }
      })

      // Next, check the global namespace to see if this user or groups have "SuperUser" permissions
      systemPermissions.resourcePermissions.forEach((access) => {
        // We are checking if the logged in user or any of the users groups have permission to write.
        if ((loggedInUser.id === access.systemActorId) || (loggedInUser.groupIds.indexOf(access.systemActorId) >= 0)) {
          accessResult[PERMISSIONS.IS_SUPERUSER] = (access.rolePermissions === Constants.SUPER_USER_PERMISSIONS)
        }
      })
      return Promise.resolve(accessResult)
    })
    .catch(err => console.error(err))
}

// Set the superuser flag for the specified user
function setSuperUserFlag(isSuperUser) {
  return {
    type: Actions.SET_SUPERUSER_FLAG,
    payload: {
      isSuperUser: isSuperUser
    }
  }
}

// Get the superuser flag for the specified user from the server
function getSuperUserFlag(userId) {
  return (dispatch) => {
    return getEffectivePermissions('SYSTEM', '1', {id: userId, groupIds: []})
      .then(permissions => dispatch(setSuperUserFlag(permissions && permissions.IS_SUPERUSER)))
      .catch(err => console.log(err))
  }
}

// Set the logged in user
function setLoggedInUser(loggedInUser) {
  return dispatch => {
    // Set the logged in user
    dispatch({
      type: Actions.SET_LOGGED_IN_USER,
      loggedInUser: loggedInUser
    })
    
    // Check if the logged in user is a superuser
    dispatch(getSuperUserFlag(loggedInUser.id))
  }
}

export default {
  setLoggedInUser: setLoggedInUser
}