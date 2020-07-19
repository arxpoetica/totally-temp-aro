import Actions from '../../common/actions'

function postNotification (noteId, notification) {
  return {
    type: Actions.NOTIFICATION_POST,
    payload: { noteId, notification }
  }
}

function updateNotification (noteId, notification) {
  return {
    type: Actions.NOTIFICATION_UPDATE,
    payload: { noteId, notification }
  }
}

function removeNotification (noteId) {
  return {
    type: Actions.NOTIFICATION_REMOVE,
    payload: noteId
  }
}

export default {
  postNotification,
  updateNotification,
  removeNotification
}
