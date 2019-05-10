const amqp = require('amqplib/callback_api')
const helpers = require('../helpers')
const Sockets = require('./sockets')
const MessageQueueManager = require('./message-queue-manager')
const config = helpers.config
const VECTOR_TILE_DATA_MESSAGE = 'VECTOR_TILE_DATA'
const VECTOR_TILE_EXCHANGE = 'aro_vt'
const VECTOR_TILE_QUEUE = 'vectorTileQueue'
const TILE_INVALIDATION_MESSAGE = 'TILES_INVALIDATED'
const TILE_INVALIDATION_EXCHANGE = 'tile_invalidation'
const TILE_INVALIDATION_QUEUE = 'tileInvalidationQueue'
const PROGRESS_MESSAGE = 'PROGRESS_MESSAGE_DATA'
const PROGRESS_EXCHANGE = 'aro_progress'
const PROGRESS_QUEUE = 'progressQueue'

class SocketManager {
  constructor (app) {
    this.vectorTileRequestToRoom = {}
    this.sockets = new Sockets(app)
    this.setupPerClientSocket()
    this.setupPerPlanSocket()

    this.messageQueueManager = new MessageQueueManager(config.rabbitmq.server, config.rabbitmq.username, config.rabbitmq.password)
    this.setupVectorTileAMQP(this.messageQueueManager)
    this.setupTileInvalidationAMQP(this.messageQueueManager)
    this.setupProgressAMQP(this.messageQueueManager)
    this.messageQueueManager.connectToPublisher()
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
  setupVectorTileAMQP (messageQueueManager) {
    var self = this
    const messageHandler = msg => {
      const uuid = JSON.parse(msg.content.toString()).uuid
      const clientId = self.vectorTileRequestToRoom[uuid]
      if (!clientId) {
        console.error(`ERROR: No socket clientId found for vector tile UUID ${uuid}`)
      } else {
        console.log(`Vector Tile Socket: Routing message with UUID ${uuid} to /${clientId}`)
        delete self.vectorTileRequestToRoom[uuid]
        self.sockets.clients.to(`/${clientId}`).emit('message', { type: VECTOR_TILE_DATA_MESSAGE, data: msg })
      }
    }
    messageQueueManager.addConsumer(VECTOR_TILE_QUEUE, VECTOR_TILE_EXCHANGE, messageHandler)
  }

  // Map a vector tile request UUID to a client ID.
  mapVectorTileUuidToClientId (vtUuid, clientId) {
    this.vectorTileRequestToRoom[vtUuid] = clientId
  }

  // Set up a connection to the aro-service RabbitMQ server for getting vector tile invalidation data. These messages
  // should be broadcast to all connected clients (via the tileInvalidation namespace).
  setupTileInvalidationAMQP (messageQueueManager) {
    var self = this
    const messageHandler = msg => {
      console.log('Received tile invalidation message from service')
      console.log(msg.content.toString())
      self.sockets.tileInvalidation.emit('message', {
        type: TILE_INVALIDATION_MESSAGE,
        payload: JSON.parse(msg.content.toString())
      })
    }
    messageQueueManager.addConsumer(TILE_INVALIDATION_QUEUE, TILE_INVALIDATION_EXCHANGE, messageHandler)
  }

  setupProgressAMQP (messageQueueManager) {
    // Create progress channel
    var self = this
    const progressHandler = msg => {
      const processId = JSON.parse(msg.content.toString()).processId
      if (!processId) {
        console.error(`ERROR: No socket roomId found for processId ${processId}`)
      } else {
        console.log(`Optimization Progress Socket: Routing message with UUID ${processId} to /${processId}`)
        var data = JSON.parse(msg.content.toString())
        // UI dependent on optimizationState at so many places TODO: need to remove optimizationstate
        data.optimizationState = data.progress != 1 ? 'STARTED' : 'COMPLETED'
        self.sockets.plans.to(`/${processId}`).emit('message', { type: PROGRESS_MESSAGE, data: data })
      }
    }
    messageQueueManager.addConsumer(PROGRESS_QUEUE, PROGRESS_EXCHANGE, progressHandler)
  }

  // // Sets up a AMQP connection with aro-service
  // setupAMQPConnectionWithService (queue, exchange, messageHandler) {
  //   // We will receive vector tile data via a RabbitMQ server
  //   const rabbitMqConnectionString = `amqp://${config.rabbitmq.username}:${config.rabbitmq.password}@${config.rabbitmq.server}`
  //   amqp.connect(rabbitMqConnectionString, (err, conn) => {
  //     if (err) {
  //       console.error('ERROR when connecting to the RabbitMQ server')
  //       console.error(err)
  //     } else {
  //       conn.createChannel(function (err, ch) {
  //         if (err) {
  //           console.error('ERROR when trying to create a channel on the RabbitMQ server')
  //           console.error(err)
  //         }
  //         ch.assertQueue(queue, { durable: false })
  //         ch.assertExchange(exchange, 'topic')
  //         ch.bindQueue(queue, exchange, '#')
  //         ch.consume(queue, messageHandler, { noAck: true })
  //       })
  //     }
  //   })
  // }

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
