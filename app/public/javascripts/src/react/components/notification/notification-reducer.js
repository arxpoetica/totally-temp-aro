import Actions from '../../../common/actions'

const defaultState = {
  notifications: {},
  lastId: 0
}

function postNotification (state, notification) {
  const noteId = state.lastId + 1
  var notifications = { ...state.notifications }
  notifications[noteId] = notification
  return { ...state,
    lastId: noteId,
    notifications: notifications
  }
}

function updateNotification (state, noteId, notification) {
  if (!state.notifications.hasOwnProperty(noteId)) return state
  var notifications = { ...state.notifications }
  notifications[noteId] = notification
  return { ...state,
    notifications: notifications
  }
}

function removeNotification (state, noteId) {
  if (!state.notifications.hasOwnProperty(noteId)) return state
  var newLastId = state.lastId
  var notifications = { ...state.notifications }
  delete notifications[noteId]
  // if list is empty we can reset the ID counter
  if (Object.keys(notifications).length === 0) newLastId = 0
  return { ...state,
    lastId: newLastId,
    notifications: notifications
  }
}

function notificationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.NOTIFICATION_POST:
      return postNotification(state, action.payload)
    case Actions.NOTIFICATION_UPDATE:
      return updateNotification(state, action.payload.noteId, action.payload.notification)
    case Actions.NOTIFICATION_REMOVE:
      return removeNotification(state, action.payload)
    default:
      return state
  }
}

export default notificationReducer
