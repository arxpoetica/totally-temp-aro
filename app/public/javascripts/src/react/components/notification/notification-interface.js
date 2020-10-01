import NotificationActions from './notification-actions'
import uuidStore from '../../../shared-utils/uuid-store'

function postNotification (dispatch, notification, autoExpire) {
  const noteId = uuidStore.getUUID()
  dispatch(NotificationActions.postNotification(noteId, notification))
  if (typeof autoExpire !== 'undefined') {
    removeNotification(dispatch, noteId, autoExpire)
  }
  return noteId
}

function updateNotification (dispatch, noteId, notification, autoExpire) {
  dispatch(NotificationActions.updateNotification(noteId, notification))
  if (typeof autoExpire !== 'undefined') {
    removeNotification(dispatch, noteId, autoExpire)
  }
  return noteId
}

function removeNotification (dispatch, noteId, autoExpire) {
  if (typeof autoExpire !== 'undefined') {
    // set a function to pull the note in X milliseconds, where X = autoExpire
    setTimeout(() => {
      dispatch(NotificationActions.removeNotification(noteId))
    }, autoExpire)
  } else {
    dispatch(NotificationActions.removeNotification(noteId))
  }
  return null
}

export default {
  postNotification,
  updateNotification,
  removeNotification
}
