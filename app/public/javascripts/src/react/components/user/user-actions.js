import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'

function loadAuthPermissions () {
  // Get the permission bits from aro-service
  var authPermissions = {}
  return (dispatch) => {
    AroHttp.get('/service/auth/permissions')
      .then(result => {
        result.data.forEach((authPermissionEntity) => {
          var displayName = authPermissionEntity.name
          displayName = displayName.replace('_', ' ')
          displayName = displayName.toLowerCase()
          displayName = displayName.replace(/(^| )(\w)/g, (initial) => {
            return initial.toUpperCase()
          })
          authPermissions[authPermissionEntity.name] = { ...authPermissionEntity,
            permissionBits: authPermissionEntity.id,
            displayName: displayName
          }
        })
        dispatch({
          type: Actions.USER_SET_AUTH_PERMISSIONS,
          payload: authPermissions
        })
      })
      .catch(err => console.log(err))
  }
}

function updateUserAccount (user) {
  return dispatch => {
    AroHttp.post('/settings/update_settings', user)
      .then(result => dispatch({
        type: Actions.USER_UPDATE_USER,
        payload: user
      }))
      .catch((err) => console.error(err))
  }
}

function loadAuthRoles () {
  // Get the permission bits from aro-service
  var authRoles = {}
  return (dispatch) => {
    AroHttp.get('/service/auth/roles')
      .then(result => {
        result.data.forEach((authRolesEntity) => {
          var displayName = authRolesEntity.name
          displayName = displayName.replace('_', ' ')
          displayName = displayName.toLowerCase()
          displayName = displayName.replace(/(^| )(\w)/g, (initial) => {
            return initial.toUpperCase()
          })
          authRoles[authRolesEntity.name] = { ...authRolesEntity,
            permissionBits: authRolesEntity.permissions,
            displayName: displayName
          }
        })
        dispatch({
          type: Actions.USER_SET_AUTH_ROLES,
          payload: authRoles
        })
      })
      .catch(err => console.log(err))
  }
}

// Set the logged in user
function setLoggedInUser (loggedInUser) {
  return dispatch => {
    // Set the logged in user
    dispatch({
      type: Actions.USER_SET_LOGGED_IN_USER,
      payload: loggedInUser
    })
  }
}

// Load the list of system actors (i.e. users and groups)
function loadSystemActors () {
  return dispatch => {
    Promise.all([
      AroHttp.get('/service/auth/groups'),
      AroHttp.get('/service/auth/users')
    ])
      .then(results => {
        // Add a property specifying if an actor is a group or a user. Also, keep only a few
        // properties (e.g. do not save email ids, those are also the login usernames)
        var systemActors = {} // System actors will be keyed by id
        results[0].data.forEach(group => {
          systemActors[group.id] = {
            ...group,
            type: 'group'
          }
        })
        results[1].data.forEach(user => {
          systemActors[user.id] = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            type: 'user'
          }
        })
        dispatch({
          type: Actions.USER_SET_SYSTEM_ACTORS,
          payload: systemActors
        })
      })
      .catch(err => console.error(err))
  }
}

export default {
  loadAuthPermissions,
  loadAuthRoles,
  loadSystemActors,
  setLoggedInUser,
  updateUserAccount
}
