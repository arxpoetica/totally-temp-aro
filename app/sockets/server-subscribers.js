import { socketLogger } from './server-socket-utils.js'
import { CHANNEL_NAMES, SOCKET_EVENTS } from '../socket-namespaces.js'
import kleur from 'kleur'

export const setSubscribers = (channelName, socket, channel) => {

  socket.on('SOCKET_JOIN_ROOM', roomId => {
    socketLogger(`Client with id ${socket.client.id} joined room ${roomId} on socket with namespace ${channelName}`)
    socket.join(`${roomId}`)
  })
  socket.on('SOCKET_LEAVE_ROOM', roomId => {
    socketLogger(`Client with id ${socket.client.id} left room ${roomId} on socket with namespace ${channelName}`)
    socket.leave(`${roomId}`)
  })

  if (channelName === CHANNEL_NAMES.BROADCAST) {

    socket.on(SOCKET_EVENTS.ADMIN_BROADCAST, payload => {
      const { loggedInUserID } = payload
      channel.to(loggedInUserID).emit('message', {
        type: SOCKET_EVENTS.ADMIN_BROADCAST,
        payload,
      })
      socketLogger(`SOCKET EMIT broadcast to logged in users: ${loggedInUserID}`, payload)
    })

  }

}
