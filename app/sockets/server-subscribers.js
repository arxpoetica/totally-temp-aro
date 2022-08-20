const { socketLogger } = require('./server-socket-utils')
const { CHANNEL_NAMES, SOCKET_EVENTS } = require('../socket-namespaces')
const kleur = require('kleur')

function blamo(lead = 'LOGGING') {
  console.log(kleur.bgBlack().white('                            '))
  console.log(kleur.bgBlack().white(`          ${lead}:          `))
  console.log(kleur.bgBlack().white('                            '))
  console.log()
}

module.exports.setSubscribers = (channelName, socket, channel) => {

  socket.on('SOCKET_JOIN_ROOM', roomId => {
    socketLogger(`Client with id ${socket.client.id} joined room ${roomId} on socket with namespace ${channelName}`)
    socket.join(`${roomId}`)
  })
  socket.on('SOCKET_LEAVE_ROOM', roomId => {
    socketLogger(`Client with id ${socket.client.id} left room ${roomId} on socket with namespace ${channelName}`)
    socket.leave(`${roomId}`)
  })

  if (channelName === CHANNEL_NAMES.BROADCAST) {
    blamo()

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
