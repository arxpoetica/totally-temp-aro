import { SOCKET_EVENTS } from '../../../../socket-namespaces'
import { ClientSocketManager } from '../react/common/client-sockets'
import ResourceActions from '../react/components/resource-editor/resource-actions'
import { RECALC_EVENT_TYPES } from '../react/components/resource-editor/competitor/competitor-shared'
import { Notifier } from '../react/common/notifications'
const utf8decoder = new TextDecoder()

export const createSocketMiddleware = () => {
  return storeAPI => {

    const { dispatch } = storeAPI

    ClientSocketManager.subscribe(SOCKET_EVENTS.COMPETITION_UPDATES, ({ payload }) => {
      const data = JSON.parse(utf8decoder.decode(payload))
      // console.log({ data })

      if (data.eventType === RECALC_EVENT_TYPES.REBUILD_FAILED) {
        const message = [
          'The competition manager failed to update correctly.',
          'Please contact your system admin for help.',
        ].join(' ')
        Notifier.error(message, { title: 'Failed Competition Manager Recalculation' })
        return
      }

      dispatch(ResourceActions.setRecalcState(data.config.state))
    })

    // next is the following action to be run after this middleware
    return next => action => next(action)
  }

}
