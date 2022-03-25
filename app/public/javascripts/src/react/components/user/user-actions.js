import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'
import GlobalsettingsActions from '../global-settings/globalsettings-action'

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
      .then(result => {
        dispatch({
          type: Actions.USER_UPDATE_USER,
          payload: user
        })
        if (result.status === 200) {
          dispatch(GlobalsettingsActions.customErrorHandle('Success', 'Updated Successfully', 'success'))
        }
      })
      .catch((err) =>  {
        // TODO: we have to come up with a strategy of global error handler
        // and success message toast rather then message boxes
        swal({ title: err.data.error, type: 'error' })
        console.log(err)
      })
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

function setLoggedInUserProjectId (projectId) {
  return dispatch => {
    dispatch({
      type: Actions.USER_SET_LOGGED_IN_USER_PROJECT,
      payload: projectId
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

function loadUserSettings (userId) {
  return dispatch => {
    AroHttp.get(`/service/auth/users/${userId}/configuration`)
      .then(result => dispatch({
        type: Actions.USER_SET_CONFIGURATION,
        payload: result.data
      }))
      .catch((err) => console.error(err))

      const filter = `deleted eq false and userId eq ${userId}`
      // const RESOUSRCE_READ = 4
      AroHttp.get(`/service/odata/userprojectentity?$select=id,name,permissions&$filter=${filter}&$orderby=name&$top=10000`)
      .then(result => dispatch({
        type: Actions.USER_PROJECT_TEMPLATES,
        payload: result.data
      }))
      .catch((err) => console.error(err))
  }
}

function saveUserSettings (userId,userConfiguration) {

  return dispatch => {
    AroHttp.post(`/service/auth/users/${userId}/configuration`, userConfiguration)
      .then(result => dispatch(
        loadUserSettings(userId)
      ))
      .catch((err) => console.error(err))
  }
}

function loadGroups () {

  return dispatch => {
    AroHttp.get('/service/auth/groups')
    .then(result => dispatch({
      type: Actions.USER_SET_GROUP,
      payload: result.data
    }))
    .catch((err) => console.error(err))
  }
}


function loadUsers () {
  return dispatch => {
    AroHttp.get(`/service/auth/users`)
    .then(result => dispatch({
      type: Actions.USER_SET_USERLIST,
      payload: result.data
    }))
    .catch((err) => console.error(err))
  }
}

function resendLink (user) {
  return dispatch => {
    AroHttp.post('/admin/users/resend', { user: user.id })
    .then(result => dispatch(
      loadUsers())
    )
    .catch((err) => console.error(err))
  }
}

function deleteUser (user) {
  return dispatch => {
    AroHttp.delete(`/service/auth/users/${user.id}`)
    .then(result => dispatch(
      loadUsers())
    )
    .catch((err) => console.error(err))
  }
}

function openSendMail () {

  return dispatch => {
    dispatch({
      type: Actions.USER_SET_SEND_MAIL_FLAG,
      payload: null
    })
  }

}

function sendEmail (mail) {

  return dispatch => {
    AroHttp.post('/admin/users/mail', { subject: mail.mailSubject, text: mail.mailBody})
    .then(result => dispatch(
      loadUsers())
    )
    .catch((err) => console.error(err))
  }
}

function openNewUser () {

  return dispatch => {
    dispatch({
      type: Actions.USER_SET_NEW_USER_FLAG,
      payload: null
    })
  }

}

function registerUser (newUser) {
  var serviceUser = newUser
  serviceUser.groupIds = []
  newUser.groups.forEach((group) => serviceUser.groupIds.push(group.id))

  return dispatch => {
    var promise = new Promise(function(resolve, reject) { 

      AroHttp.post('/admin/users/registerWithoutPassword', serviceUser)
      .then((response) => {
        if(response.status === 200){
          dispatch(GlobalsettingsActions.customErrorHandle('Success', 'User Registered Successfully', 'success'))
          resolve(); 
        }
      })
      .catch((err) => {
        console.error(err)
        dispatch(GlobalsettingsActions.customErrorHandle('Failed to Register user', 'ARO-Service returned status code 500', 'error'))
      })
    })
    promise
    .then(function () { 
      dispatch(
        loadUsers()
      )
    })
    .catch((err) => console.error(err))
  }
}

function handlePageClick (selectedPage) {
  return dispatch => {
     dispatch({
        type: Actions.USER_HANDLE_PAGE_CLICK,
        payload: selectedPage
      })
  }
}

function searchUsers (searchText) {
  return dispatch => {
     dispatch({
        type: Actions.USER_SEARCH_USERS,
        payload: searchText
      })
  }
}

function saveUsers (allUsers) {  

  return dispatch => {
    var promise = new Promise(function(resolve, reject) { 

      allUsers.forEach((user, index) => {
        if(user.isUpdated){
          // aro-service requires group ids in the user objects. replace group objects by group ids
          var serviceUser = user
          serviceUser.groupIds = []
          if(serviceUser.userGroups !== null){
            serviceUser.userGroups.forEach((userGroup) => serviceUser.groupIds.push(userGroup.id))
            delete serviceUser.userGroups
            delete serviceUser.isUpdated
          } else {
            delete serviceUser.userGroups
            delete serviceUser.isUpdated            
          }

          AroHttp.put('/service/auth/users', serviceUser)
          .then((response) => {
              if(response.status === 200){
                resolve(); 
              }
          })
          .catch((err) => console.error(err))
        }
      })
    })
    promise
    .then(function () { 
      dispatch(
        loadUsers()
      )
    })
    .catch((err) => console.error(err))
  }
}

  function clearUserList () {
    return {
      type: Actions.USER_SET_USERLIST,
      payload: []
    }
  }

export default {
  loadAuthPermissions,
  loadAuthRoles,
  loadSystemActors,
  setLoggedInUser,
  updateUserAccount,
  loadUserSettings,
  saveUserSettings,
  loadGroups,
  loadUsers,
  resendLink,
  deleteUser,
  openSendMail,
  sendEmail,
  openNewUser,
  registerUser,
  handlePageClick,
  searchUsers,
  saveUsers,
  clearUserList,
  setLoggedInUserProjectId
}
