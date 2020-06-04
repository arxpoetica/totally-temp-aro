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
  return dispatch => {
    AroHttp.post('/service/auth/groups', {
      id: group.id,
      name: group.name,
      description: group.description
    })
    .then(result => dispatch({
      type: Actions.GLOBAL_SETTINGS_SAVE_GROUP,
      payload: result.data
    }))
    .then(result => dispatch(
      reLoadGroups()
    ))
    .catch((err) => console.error(err))
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
      .catch((err) => console.error(err))
  }
}

function updateTag(updatedTag) {
  return dispatch => {
    AroHttp.put(`/service/tag-mapping/tags`, _.omit(updatedTag, 'type'))
      .then(result => dispatch(
        loadTags ()
      ))
      .catch((err) => console.error(err))
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
  updateTag
}