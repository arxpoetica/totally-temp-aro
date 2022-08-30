import { SocketManager } from '../../react/common/socket-manager'
import GlobalsettingsActions from '../../react/components/global-settings/globalsettings-action'

const createSocketMiddleware = () => {
  return storeAPI => {
    SocketManager.subscribe('NOTIFICATION_SHOW', (command) => {
      const { dispatch } = storeAPI
      // Dispatch an action to notify the broadcast message
      dispatch(GlobalsettingsActions.notifyBroadcast(command.payload))
    })

    // next is the following action to be run after this middleware
    return next => action => {
      return next(action)
    }
  }
}

export default createSocketMiddleware
