import NotificationActions from './notification-actions'
import uuidStore from '../../../shared-utils/uuid-store'

function postNotification (dispatch, notification) {
  const noteId = uuidStore.getUUID()
  dispatch(NotificationActions.postNotification(noteId, notification))
  return noteId
}

function updateNotification (dispatch, noteId, notification) {
  dispatch(NotificationActions.updateNotification(noteId, notification))
  return noteId
}

function removeNotification (dispatch, noteId) {
  dispatch(NotificationActions.removeNotification(noteId))
  return null
}

export default {
  postNotification,
  updateNotification,
  removeNotification
}
