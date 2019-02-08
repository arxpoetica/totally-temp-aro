import io from 'socket.io-client'
import Actions from '../../react/common/actions'
const socket = io()

// socket.on('connect', () => socket.emit('SOCKET_SUBSCRIBE_TO_ROOM', 'plans'))

const createSocketMiddleware = () => {
  return storeAPI => {

    socket.on("message", (message) => {
      storeAPI.dispatch({
        type: "SOCKET_MESSAGE_RECEIVED",
        payload: message
      })
    })

    return next => action => {
      if (action.type === Actions.SOCKET_SUBSCRIBE_TO_ROOM) {
        socket.emit('SOCKET_SUBSCRIBE_TO_ROOM', '/plan/10')
          // .on('message', (message) => {
          //   console.log('message received')
          //   console.log(message)
          // })
        return
      }

      return next(action)
    }
  }
}

export default createSocketMiddleware
