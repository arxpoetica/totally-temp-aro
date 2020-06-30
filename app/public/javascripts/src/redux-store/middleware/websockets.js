import io from 'socket.io-client'
import { toast } from 'react-toastify'
import Actions from '../../react/common/actions'
import socketManager from '../../react/common/socket-manager'

const createSocketMiddleware = () => {
  return storeAPI => {
    // If we get a raw Redux command, dispatch it
    socketManager.subscribe('NOTIFICATION_SHOW', (command) => {
      toast.error(command.payload.subject + ': ' + command.payload.body, {
        position: toast.POSITION.BOTTOM_LEFT,
        className: 'map-canvas',
        autoClose: command.payload.isChecked
      })
      // storeAPI.dispatch(command)
    })

    // --- for test
    /*
    console.log('--- subscribe to new events ---')
    var testEvents = [
      'LIBRARY_CREATE',
      'LIBRARY_DELETE',
      'ETL_START',
      'ETL_UPDATE',
      'ETL_CLOSE'
    ]
    testEvents.forEach(eventName => {
      socketManager.subscribe(eventName, (command) => {
        console.log(` --- ${eventName} ---`)
        console.log(command)
        console.log(' --- ')
      })
    })
    */
    // ---

    // next is the following action to be run after this middleware
    return next => action => {
      return next(action)
    }
  }
}

export default createSocketMiddleware
