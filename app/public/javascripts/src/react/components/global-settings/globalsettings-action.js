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



export default {
  broadcastMessage,
  loadReleaseNotes,
  loadOtpStatus,
  overwriteSecretForUser,
  verifySecretForUser,
  sendOTPByEmail,
  disableMultiAuth,
  resetMultiFactorForUser
}