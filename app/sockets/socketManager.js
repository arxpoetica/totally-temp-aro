const helpers = require('../helpers')
const Sockets = require('./sockets')
const MessageQueueManager = require('./message-queue-manager')
const Consumer = require('./consumer')
const config = helpers.config
const socketConfig = Object.freeze({
  vectorTile: {
    message: 'VECTOR_TILE_DATA',
    exchange: 'aro_vt',
    queue: 'vectorTileQueue'
  },
  invalidation: {
    message: 'TILES_INVALIDATED',
    exchange: 'tile_invalidation',
    queue: 'tileInvalidationQueue'
  },
  progress: {
    message: 'PROGRESS_MESSAGE_DATA',
    exchange: 'aro_progress',
    queue: 'progressQueue'
  }
})

class SocketManager {
  constructor (app) {
    this.vectorTileRequestToRoom = {}
    this.sockets = new Sockets(app)
    this.setupPerClientSocket()
    this.setupPerPlanSocket()

    // Set up a message queue manager to get messages from ARO-Service
    const messageQueueManager = new MessageQueueManager(config.rabbitmq.server, config.rabbitmq.username, config.rabbitmq.password)
    messageQueueManager.addConsumer(this.getVectorTileConsumer())
    messageQueueManager.addConsumer(this.getTileInvalidationConsumer())
    messageQueueManager.addConsumer(this.getOptimizationProgressConsumer())
    messageQueueManager.connectToPublisher()
  }

  // Set up the per-client socket namespace. Each client connected to the server will register with this namespace.
  setupPerClientSocket () {
    this.sockets.clients.on('connection', (socket) => {
      console.log(`Connected socket with session id ${socket.client.id}`)

      socket.on('SOCKET_JOIN_ROOM', (roomId) => {
        console.log(`Joining socket room: /${roomId}`)
        socket.join(`/${roomId}`)
      })
      socket.on('SOCKET_LEAVE_ROOM', (roomId) => {
        console.log(`Leaving socket room: /${roomId}`)
        socket.leave(`/${roomId}`)
      })
    })
  }

  // Set up the per-plan socket namespace. Each client connected to the server will register with this namespace.
  setupPerPlanSocket () {
    this.sockets.plans.on('connection', (socket) => {
      console.log(`Connected socket with session id ${socket.client.id}`)

      socket.on('SOCKET_JOIN_PLAN_ROOM', (roomId) => {
        console.log(`Joining socket plan room: /${roomId}`)
        socket.join(`/${roomId}`)
      })
      socket.on('SOCKET_LEAVE_PLAN_ROOM', (roomId) => {
        console.log(`Leaving socket plan room: /${roomId}`)
        socket.leave(`/${roomId}`)
      })
    })
  }

  // Set up a connection to the aro-service RabbitMQ server for getting vector tile data. This function is also
  // responsible for routing the vector tile data to the correct connected client.
  getVectorTileConsumer () {
    const self = this
    const messageHandler = msg => {
      const uuid = JSON.parse(msg.content.toString()).uuid
      const clientId = self.vectorTileRequestToRoom[uuid]
      if (!clientId) {
        console.error(`ERROR: No socket clientId found for vector tile UUID ${uuid}`)
      } else {
        console.log(`Vector Tile Socket: Routing message with UUID ${uuid} to /${clientId}`)
        delete self.vectorTileRequestToRoom[uuid]
        self.sockets.clients.to(`/${clientId}`).emit('message', { type: socketConfig.vectorTile.message, data: msg })
      }
    }
    return new Consumer(socketConfig.vectorTile.queue, socketConfig.vectorTile.exchange, messageHandler)
  }

  // Map a vector tile request UUID to a client ID.
  mapVectorTileUuidToClientId (vtUuid, clientId) {
    this.vectorTileRequestToRoom[vtUuid] = clientId
  }

  // Set up a connection to the aro-service RabbitMQ server for getting vector tile invalidation data. These messages
  // should be broadcast to all connected clients (via the tileInvalidation namespace).
  getTileInvalidationConsumer () {
    const self = this
    const messageHandler = msg => {
      console.log('Received tile invalidation message from service')
      console.log(msg.content.toString())
      self.sockets.tileInvalidation.emit('message', {
        type: socketConfig.invalidation.message,
        payload: JSON.parse(msg.content.toString())
      })
    }
    return new Consumer(socketConfig.invalidation.queue, socketConfig.invalidation.exchange, messageHandler)
  }

  getOptimizationProgressConsumer () {
    // Create progress channel
    const self = this
    const messageHandler = msg => {
      const processId = JSON.parse(msg.content.toString()).processId
      if (!processId) {
        console.error(`ERROR: No socket roomId found for processId ${processId}`)
      } else {
        console.log(`Optimization Progress Socket: Routing message with UUID ${processId} to /${processId}`)
        var data = JSON.parse(msg.content.toString())
        // UI dependent on optimizationState at so many places TODO: need to remove optimizationstate
        data.progress = (data.jobsCompleted + 1) / (data.totalJobs + 1)
        data.optimizationState = data.progress != 1 ? 'STARTED' : 'COMPLETED'
        self.sockets.plans.to(`/${processId}`).emit('message', { type: socketConfig.progress.message, data: data })
      }
    }
    return new Consumer(socketConfig.progress.queue, socketConfig.progress.exchange, messageHandler)
  }

  broadcastMessage (msg) {
    // Sending to all clients in namespace 'broadcast', including sender
    this.sockets.broadcast.emit('message', {
      type: 'NOTIFICATION_SHOW',
      payload: msg
    })
  }
}

let socketManager = null
module.exports = {
  initialize: app => { socketManager = new SocketManager(app) },
  socketManager: () => socketManager
}
