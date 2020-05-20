import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'
import UserActions from '../user/user-actions'


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

function updateUserAccount (user) {
  return dispatch => {
    AroHttp.post('/settings/update_settings', user)
      .then(result => dispatch(
        /*state.user.loggedInUser.first_name=user.first_name,
        state.user.loggedInUser.last_name=user.last_name,
        state.user.loggedInUser.email=user.email,*/
        UserActions.loadSystemActors()
      ))
      .catch((err) => console.error(err))
  }
}

function loadMultiFactor () {
  return dispatch => {
    AroHttp.get('/multifactor/get-totp-status')
      .then(result => dispatch({
        type: Actions.GLOBAL_SETTINGS_GET_OTP_STATUS,
        payload: result.data[0]
      }))
      .catch(err => console.error(err))
  }
}

export default {
  broadcastMessage,
  loadReleaseNotes,
  updateUserAccount,
  loadMultiFactor
}