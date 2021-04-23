import io from 'socket.io-client'
import { toast } from 'react-toastify'
import Actions from '../../react/common/actions'
import socketManager from '../../react/common/socket-manager'

const createSocketMiddleware = () => {
  return storeAPI => {
    // Join room for this broadcast
    socketManager.joinRoom('broadcast', 'broadcast')
    socketManager.subscribe('NOTIFICATION_SHOW', (command) => {
      toast.error(command.payload.subject + ': ' + command.payload.body, {
        position: toast.POSITION.BOTTOM_LEFT,
        className: 'map-canvas',
        autoClose: command.payload.isChecked
      })
    })

    // next is the following action to be run after this middleware
    return next => action => {
      return next(action)
    }
  }
}

export default createSocketMiddleware
