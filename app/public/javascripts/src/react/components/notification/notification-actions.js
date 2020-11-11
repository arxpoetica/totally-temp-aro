import Actions from '../../common/actions'

function postNotification (noteId, notification, type) {
  return {
    type: Actions.NOTIFICATION_POST,
    payload: { noteId, notification, type }
  }
}

function updateNotification (noteId, notification, type) {
  return {
    type: Actions.NOTIFICATION_UPDATE,
    payload: { noteId, notification, type }
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
