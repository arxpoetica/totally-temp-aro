import io from 'socket.io-client'
import Actions from '../../react/common/actions'
const socket = io()

const createSocketMiddleware = () => {
  return storeAPI => {
    // If we get a raw Redux command, dispatch it
    socket.on('REDUX_COMMAND', (command) => {
      storeAPI.dispatch(command)
    })

    return next => action => {
      if (action.type === Actions.SOCKET_SUBSCRIBE_TO_ROOM) {
        socket.emit('SOCKET_SUBSCRIBE_TO_ROOM', action.payload.planId)
        return
      }

      return next(action)
    }
  }
}

export default createSocketMiddleware
