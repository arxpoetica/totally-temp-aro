import { SOCKET_EVENTS } from '../../../../socket-namespaces'
import { ClientSocketManager } from '../react/common/client-sockets'
// import GlobalsettingsActions from '../react/components/global-settings/globalsettings-action'
import ResourceActions from '../react/components/resource-editor/resource-actions'
const utf8decoder = new TextDecoder()

export const createSocketMiddleware = () => {
  return storeAPI => {

    const { dispatch } = storeAPI

    ClientSocketManager.subscribe(SOCKET_EVENTS.COMPETITION_UPDATES, ({ payload }) => {
      const data = JSON.parse(utf8decoder.decode(payload))
      dispatch(ResourceActions.setRecalcState(data.config.state))
    })

    // next is the following action to be run after this middleware
    return next => action => next(action)
  }

}
