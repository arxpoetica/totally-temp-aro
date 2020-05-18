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

function updateUserAccount (user) {
  console.log(user)
  return dispatch => {
    AroHttp.post('/settings/update_settings', user)
      .then(result => {
        // The name/email may have changed for the current user. 
        // Reload all actors
        state.reloadSystemActors() 
      })
      .catch((err) => console.error(err))
  }
}
export default {
  broadcastMessage,
  loadReleaseNotes,
  updateUserAccount
}