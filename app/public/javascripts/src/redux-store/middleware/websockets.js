import io from 'socket.io-client'
import Actions from '../../react/common/actions'
const socket = io('/broadcastRoom')

const createSocketMiddleware = () => {
  return storeAPI => {
    // If we get a raw Redux command, dispatch it
    socket.on('BROADCAST_MESSAGE', (command) => {
      storeAPI.dispatch(command)
    })

    // next is the following action to be run after this middleware
    return next => action => {
      return next(action)
    }
  }
}

export default createSocketMiddleware
