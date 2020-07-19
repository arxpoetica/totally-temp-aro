import Actions from '../../common/actions'

const defaultState = {
  notifications: {'test':{'order': 0, 'notification':'note test'}},
  lastIndex: 0
}

function postNotification (state, noteId, notification) {
  const order = state.lastIndex + 1
  var notifications = { ...state.notifications }
  notifications[noteId] = {
    noteId,
    notification,
    order
  }
  return { ...state,
    lastIndex: order,
    notifications: notifications
  }
}

function updateNotification (state, noteId, notification) {
  if (!state.notifications.hasOwnProperty(noteId)) return state
  var notifications = { ...state.notifications }
  notifications[noteId].notification = notification
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
      return postNotification(state, action.payload.noteId, action.payload.notification)
    case Actions.NOTIFICATION_UPDATE:
      return updateNotification(state, action.payload.noteId, action.payload.notification)
    case Actions.NOTIFICATION_REMOVE:
      return removeNotification(state, action.payload)
    default:
      return state
  }
}

export default notificationReducer
