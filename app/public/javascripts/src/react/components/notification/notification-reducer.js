import Actions from '../../common/actions'
import NotificationTypes from './notification-types'

const defaultState = {
  notifications: {
    '1': {
      noteId: '1',
      notification: 'this is a test',
      order: 0,
      type: 'USER_EXPIRE'
    },
    '2': {
      noteId: '2',
      notification: 'this is a test2 with a longer text',
      order: 1,
      type: 'USER_EXPIRE'
    }
  },
  lastIndex: 0
}

function postNotification (state, noteId, notification, type) {
  const order = state.lastIndex + 1
  if (typeof type === 'undefined') type = NotificationTypes['SYSTEM_EXPIRE']
  var notifications = { ...state.notifications }
  notifications[noteId] = {
    noteId,
    notification,
    order,
    type
  }
  return { ...state,
    lastIndex: order,
    notifications: notifications
  }
}

function updateNotification (state, noteId, notification, type) {
  if (!state.notifications.hasOwnProperty(noteId)) return state
  var notifications = { ...state.notifications }
  notifications[noteId].notification = notification
  if (typeof type !== 'undefined') notifications[noteId].type = type
  return { ...state,
    notifications: notifications
  }
}

function removeNotification (state, noteId) {
  if (!state.notifications.hasOwnProperty(noteId)) return state
  var newLastIndex = state.lastIndex
  var notifications = { ...state.notifications }
  delete notifications[noteId]
  // if list is empty we can reset the order counter
  if (Object.keys(notifications).length === 0) newLastIndex = 0
  return { ...state,
    lastIndex: newLastIndex,
    notifications: notifications
  }
}

function notificationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.NOTIFICATION_POST:
      return postNotification(state, action.payload.noteId, action.payload.notification, action.payload.type)
    case Actions.NOTIFICATION_UPDATE:
      return updateNotification(state, action.payload.noteId, action.payload.notification, action.payload.type)
    case Actions.NOTIFICATION_REMOVE:
      return removeNotification(state, action.payload)
    default:
      return state
  }
}

export default notificationReducer
