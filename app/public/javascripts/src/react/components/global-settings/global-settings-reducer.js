import Actions from '../../common/actions'
import { Map } from 'immutable'
import { toast } from 'react-toastify'

const defaultState = {
  broadcastedMessage: new Map()
}

// Set the broadcasted message
function showBroadcastMsg (state, msg) {
  toast.error(msg.subject + ': ' + msg.body, {
    position: toast.POSITION.BOTTOM_LEFT,
    className: 'map-canvas'
  })
  return { ...state, broadcastedMessage: msg }
}

function globalSettingsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.BROADCAST_ACTION:
      return showBroadcastMsg(state, action.payload)

    default:
      return state
  }
}

export default globalSettingsReducer
