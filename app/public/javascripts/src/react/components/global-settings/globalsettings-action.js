import AroHttp from '../../common/aro-http'

function broadcastMessage (message) {
  return dispatch => {
    AroHttp.post('/socket/broadcast', message)
      .catch((err) => console.error(err))
  }
}

export default {
  broadcastMessage: broadcastMessage
}
