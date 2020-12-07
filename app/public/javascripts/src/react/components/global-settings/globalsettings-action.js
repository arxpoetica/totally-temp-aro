import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'

function broadcastMessage (message) {
  return dispatch => {
    AroHttp.post('/socket/broadcast', message)
      .catch((err) => console.error(err))
  }
}

function loadReleaseNotes () {
  return dispatch => {
    AroHttp.get('/reports/releaseNotes')
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_GET_RELEASE_NOTES,
        payload: result.data
      }))
      .catch(err => console.error(err))
  }
}

function loadOtpStatus () {
  return dispatch => {
    AroHttp.get('/multifactor/get-totp-status')
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_GET_OTP_STATUS,
        payload: result.data[0]
      }))
      .catch(err => console.error(err))
  }
}

function overwriteSecretForUser () {
  return dispatch => {
    AroHttp.get('/multifactor/overwrite-totp-secret')
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_OVERWRITE_SECRET,
        payload: result.data
      }))
      .catch(err => console.error(err))
  }
}

function verifySecretForUser (verificationCode) {

  return dispatch => {
    AroHttp.post('/multifactor/verify-totp-secret', { verificationCode: verificationCode })
      .then(result => dispatch({
          type: Actions.GLOBAL_SETTINGS_VERIFY_SECRET,
          payload: result.data
      }))
      .catch(error => dispatch({
        type: Actions.GLOBAL_SETTINGS_ERROR_SECRET,
        payload: error.data
      }))
  }
}

function sendOTPByEmail () {
  return dispatch => {
    AroHttp.post('/send-totp-by-email', {})
      .then(result => dispatch({
          type: Actions.GLOBAL_SETTINGS_SEND_EMAIL_OTP,
          payload: result.data
      }))
      .catch((err) => console.error(err))
  }
  
}

function disableMultiAuth (disableCode) {
  return dispatch => {
    AroHttp.post('multifactor/delete-totp-settings', { verificationCode: disableCode })
      .then(result => dispatch(
        loadOtpStatus()
      ))
      .catch(error => dispatch({
        type: Actions.GLOBAL_SETTINGS_ERROR_SECRET,
        payload: error.data
      }))
  }
}

function resetMultiFactorForUser (verificationCode) {
  return dispatch => {
    AroHttp.post('/multifactor/verify-totp-secret', { verificationCode: verificationCode })
      .then(result => dispatch(
        overwriteSecretForUser()
      ))
      .catch(error => dispatch({
        type: Actions.GLOBAL_SETTINGS_ERROR_SECRET,
        payload: error.data
      }))
  }
}

function loadGroups () {

  return dispatch => {
    AroHttp.get('/service/auth/permissions')
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_LOAD_PERMISSIONS,
        payload: result.data
      }))
      .catch((err) => console.error(err))

      AroHttp.get(`/service/auth/acl/SYSTEM/1`)
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_LOAD_ACL,
        payload: result.data
      }))
      .catch((err) => console.error(err))

      AroHttp.get(`/service/auth/groups`)
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_LOAD_GROUPS,
        payload: result.data
      }))
      .catch((err) => console.error(err))
  }
}

function addGroup () {

  return dispatch => {
    AroHttp.post('/service/auth/groups', {
      name: `Group ${Math.round(Math.random() * 10000)}`, // Try to not have a duplicate group name
      description: 'Group Description'
    })
    .then(result => dispatch({
      type: Actions.GLOBAL_SETTINGS_ADD_GROUP,
      payload: result.data
    }))
    .catch((err) => console.error(err))
  }

}

function editGroup (id) {
  return dispatch => {
    AroHttp.get(`/service/auth/acl/SYSTEM/1`)
    .then(result => dispatch({
      type: Actions.GLOBAL_SETTINGS_EDIT_GROUP,
      payload: id
    }))
    .catch((err) => console.error(err))
  }
}

function saveGroup (group) {
  
  group.isEditing = false
  var userAdminPermissions = null

  return dispatch => {
    AroHttp.post('/service/auth/groups', {
      id: group.id,
      name: group.name,
      description: group.description
    })
    .then((result) => {
      return AroHttp.get('/service/auth/permissions')
    })
    .then((result) => {
      // Get the permissions for the name USER_ADMIN
      userAdminPermissions = result.data.filter((item) => item.name === 'USER_ADMIN')[0].id
      return AroHttp.get('/service/auth/acl/SYSTEM/1')
    })
    .then((result) => {
      var acls = result.data
      var groupIsInACLList = false
      acls.resourcePermissions.forEach((item, index) => {
        var resourcePermission = acls.resourcePermissions[index]
        if (resourcePermission.systemActorId === group.id) {
          // This resource permission is for the group being saved
          groupIsInACLList = true
          if (group.isAdministrator) {
            // Set the admin flag. https://stackoverflow.com/a/1436448
            resourcePermission.rolePermissions |= userAdminPermissions
          } else {
            // Remove the admin flag. https://stackoverflow.com/a/1436448
            resourcePermission.rolePermissions &= (~userAdminPermissions)
          }
        }
      })

      // In case the group is not in the ACL list at all, AND if the group is an administrator, add it to the list.
      if (!groupIsInACLList && group.isAdministrator) {
        acls.resourcePermissions.push({
          systemActorId: group.id,
          rolePermissions: userAdminPermissions
        })
      }
      // Our resource permissions may have been modifed. Save the whole lot.
      return AroHttp.put(`/service/auth/acl/SYSTEM/1`, acls)
    })
    .then(result => dispatch({
      type: Actions.GLOBAL_SETTINGS_SAVE_GROUP,
      payload: result.data
    }))
    .then(result => dispatch(
      reLoadGroups()
    ))
    .catch((err) => {
      group.isEditing = false
      console.error(err)
    })
  }

}

function deleteGroup (id) {

  return dispatch => {
    AroHttp.delete(`/service/auth/groups/${id}`)
    .then(result => dispatch({
      type: Actions.GLOBAL_SETTINGS_DELETE_GROUP,
      payload: result.data
    }))
    .then(result => dispatch(
      reLoadGroups ()
    ))
    .catch((err) => console.error(err))
  }

}

function reLoadGroups () {

  return dispatch => {
    AroHttp.get('/service/auth/permissions')
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_LOAD_PERMISSIONS,
        payload: result.data
      }))
      .catch((err) => console.error(err))

      AroHttp.get(`/service/auth/acl/SYSTEM/1`)
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_LOAD_ACL,
        payload: result.data
      }))
      .catch((err) => console.error(err))

      AroHttp.get(`/service/auth/groups`)
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_RELOAD_GROUPS,
        payload: result.data
      }))
  }
}

function loadTags () {

  return dispatch => {
    AroHttp.get('/service/tag-mapping/global-tags')
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_LOAD_TAGS,
        payload: result.data
      }))
      .catch((err) => console.error(err))
  }
}

function createTag (tag) {
  
  return dispatch => {
    AroHttp.post(`/service/tag-mapping/tags?name=${tag.name}&description=${tag.description}&colourHue=${tag.colourHue}`)
      .then(result => dispatch(
        loadTags ()
      ))
      .catch((err) => {
        console.error(err)
        dispatch(httpErrorhandle(err))
      })
  }
}

function updateTag(updatedTag) {
  return dispatch => {
    AroHttp.put(`/service/tag-mapping/tags`, _.omit(updatedTag, 'type'))
      .then(result => dispatch(
        loadTags ()
      ))
      .catch((err) => {
        console.error(err)
        dispatch(httpErrorhandle(err))
      })
  }
}

function setFlag () {

  return dispatch => {
    AroHttp.get('/service/tag-mapping/global-tags')
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_TAG_FLAG,
        payload: null
      }))
      .catch((err) => console.error(err))
  }
}

function setShowGlobalSettings (status){
  return dispatch => {
    dispatch({
      type: Actions.GLOBAL_SETTINGS_SHOW_GLOBAL_SETTINGS,
      payload: status
    })
  }
}

function askUserToConfirmBeforeDelete (title, text) {
  return dispatch => {
    return new Promise((resolve, reject) => {
      swal({
        title: `Delete "${title}"?`,
        text: `Are you sure you want to delete "${text}"?`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      }, (result) => {
        if (result) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }
}

function httpErrorhandle (err) {
  return dispatch => {
    swal({
      title: err.data.error,
      text: `ARO-Service returned status code ${err.status}`,
      type: 'error'
    })
  }
}

function customErrorHandle (title, text, type) {
  return dispatch => {
    swal({
      title: title,
      text:  text,
      type:  type
    })
  }
}

export default {
  broadcastMessage,
  loadReleaseNotes,
  loadOtpStatus,
  overwriteSecretForUser,
  verifySecretForUser,
  sendOTPByEmail,
  disableMultiAuth,
  resetMultiFactorForUser,
  loadGroups,
  addGroup,
  deleteGroup,
  saveGroup,
  editGroup,
  loadTags,
  setFlag,
  createTag,
  updateTag,
  setShowGlobalSettings,
  askUserToConfirmBeforeDelete,
  httpErrorhandle,
  customErrorHandle
}