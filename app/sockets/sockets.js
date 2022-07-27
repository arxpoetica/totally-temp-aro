const { createLogger, LOGGER_GROUPS } = require('../helpers/logger')
const logger = createLogger(LOGGER_GROUPS.SOCKET, 'yellow')

class Sockets {
  constructor (app) {
    // Socket namespaces. This is an ascending order of the number of users that the message will potentially go to.
    // Always try to stay low on the number of messages (so "client" is far better than "broadcast").
    // client: Each client that connects to the server will do so with a "<Websocket ID>". To post a message to a specific
    //         client, use the "/<Websocket ID>" room in this namespace.
    // user: A particular user, who may be logged in on multiple clients.
    // plan: A particular plan, which can be open on multiple users sessions.
    // library: A particular library, which can be referenced by a lot of users.
    // broadcast: Used for broadcasting user messages to all connected clients. This is used when, say, an admin user
    //            wants to send messages to all users.
    const socket = require('socket.io')(app)
    this.sockets = {
      client: socket.of('/client'),
      plan: socket.of('/plan'),
      user: socket.of('/user'),
      library: socket.of('/library'),
      broadcast: socket.of('/broadcast'),
      tileInvalidation: socket.of('/tileInvalidation'),
      competitionUpdates: socket.of('/competition-updates'),
    }

    // Set up logic to join/leave rooms
    Object.keys(this.sockets).forEach(socketKey => {
      logger.info(`Setting up room join/leave for socket namespace ${socketKey}`)
      const thisSocket = this.sockets[socketKey]
      thisSocket.on('connection', socket => {
        logger.info(`Client with id ${socket.client.id} connected to socket with namespace ${socketKey}`)
        socket.on('SOCKET_JOIN_ROOM', roomId => {
          logger.info(`Client with id ${socket.client.id} joined room ${roomId} on socket with namespace ${socketKey}`)
          socket.join(`${roomId}`)
        })
        socket.on('SOCKET_LEAVE_ROOM', roomId => {
          logger.info(`Client with id ${socket.client.id} left room ${roomId} on socket with namespace ${socketKey}`)
          socket.leave(`${roomId}`)
        })
      })
    })
  }

  // Emit a message to a single connected client (i.e. a browser session).
  emitToClient (clientId, payload) {
    this.sockets.client.to(`${clientId}`).emit('message', payload)
    logger.info(`SOCKET EMIT client: ${clientId}`, `payload: ${this.formatPayloadForLogging(payload)}`)
  }

  // Emit a message to a particular user. The user CAN be logged in on multiple clients.
  emitToUser (userId, payload) {
    this.sockets.user.to(`${userId}`).emit('message', payload)
    logger.info(`SOCKET EMIT user: ${userId}`, `payload: ${this.formatPayloadForLogging(payload)}`)
  }

  // Emit a message to everyone that has a plan open. Multiple users can potentially have the same plan open.
  emitToPlan (planId, payload) {
    this.sockets.plan.to(`${planId}`).emit('message', payload)
    logger.info(`SOCKET EMIT plan: ${planId}`, `payload: ${this.formatPayloadForLogging(payload)}`)
  }

  // Emit a message to everyone that is interested in a library. A lot of users can potentially have this
  // library selected in their settings.
  emitToLibrary (libraryId, payload) {
    this.sockets.library.to(`${libraryId}`).emit('message', payload)
    logger.info(`SOCKET EMIT library: ${libraryId}`, `payload: ${this.formatPayloadForLogging(payload)}`)
  }

  emitToCompetitionResourceManagerUsers (resourceManagerId, payload) {
    this.sockets.competitionUpdates.to(`${resourceManagerId}`).emit('message', payload)
    logger.info(`SOCKET EMIT competition updates: ${resourceManagerId}`, `payload: ${this.formatPayloadForLogging(payload)}`)
  }

  // Emit a message to EVERYONE connected via websockets. Use sparingly, if used at all.
  emitToAll (payload) {
    // it should be 'this.sockets.broadcast' for broadcast.
    this.sockets.broadcast.to(`broadcast`).emit('message', payload)
    logger.info(`SOCKET EMIT broadcast`, `payload: ${this.formatPayloadForLogging(payload)}`)
  }

  // Emit a message to loggedInUser connected via websockets.
  emitToLoggedInUser (loggedInUserID, payload) {
    this.sockets.broadcast.to(`${loggedInUserID}`).emit('message', payload)
    logger.info(`SOCKET  EMIT broadcast:${loggedInUserID}`, `payload: ${this.formatPayloadForLogging(payload)}`)
  }

  // Formats a payload for logging. Show only a subset of the content
  formatPayloadForLogging (payload) {
    return JSON.stringify(payload, (key, value) => {
      if (key === 'content') {
        return {
          type: value.type,
          data: `Length: ${value.data.length}`
        }
      } else {
        return value
      }
    }, 2)
  }
}

module.exports = Sockets
