const amqp = require('amqplib/callback_api')
const helpers = require('../helpers')
const config = helpers.config
const VECTOR_TILE_DATA_MESSAGE = 'VECTOR_TILE_DATA'
const VECTOR_TILE_EXCHANGE = 'aro_vt'
const VECTOR_TILE_QUEUE = 'vectorTileQueue'
const TILE_INVALIDATION_MESSAGE = 'TILES_INVALIDATED'
const TILE_INVALIDATION_EXCHANGE = 'tile_invalidation'
const TILE_INVALIDATION_QUEUE = 'tileInvalidationQueue'

class SocketManager {
  constructor (app) {
    this.vectorTileRequestToRoom = {}
    this.sockets = {
      default: require('socket.io')(app)
    }
    this.sockets.broadcast = this.sockets.default.of('/broadcast')
    this.sockets.tileInvalidation = this.sockets.default.of('/tileInvalidation')
    this.setupConnectionhandlers()
    this.setupVectorTileAMQP()
    this.setupTileInvalidationAMQP()
  }

  setupConnectionhandlers () {
    this.sockets.default.on('connection', (socket) => {
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

  setupVectorTileAMQP () {
    // We will receive vector tile data via a RabbitMQ server
    var self = this
    const messageHandler = msg => {
      const uuid = JSON.parse(msg.content.toString()).uuid
      const roomId = self.vectorTileRequestToRoom[uuid]
      if (!roomId) {
        console.error(`ERROR: No socket roomId found for vector tile UUID ${uuid}`)
      } else {
        console.log(`Vector Tile Socket: Routing message with UUID ${uuid} to /${roomId}`)
        delete self.vectorTileRequestToRoom[uuid]
        self.sockets.default.to(`/${roomId}`).emit('message', { type: VECTOR_TILE_DATA_MESSAGE, data: msg })
      }
    }
    this.setupAMQPConnectionWithService(VECTOR_TILE_QUEUE, VECTOR_TILE_EXCHANGE, messageHandler)
  }

  setupTileInvalidationAMQP () {
    // We will receive vector tile invalidation messages via a RabbitMQ server. These should be broadcast to all connected clients
    var self = this
    const messageHandler = msg => {
      self.sockets.tileInvalidation.emit('message', {
        type: TILE_INVALIDATION_MESSAGE,
        payload: JSON.parse(msg.content.toString())
      })
    }
    this.setupAMQPConnectionWithService(TILE_INVALIDATION_QUEUE, TILE_INVALIDATION_EXCHANGE, messageHandler)
  }

  // Sets up a AMQP connection with aro-service
  setupAMQPConnectionWithService (queue, exchange, messageHandler) {
    // We will receive vector tile data via a RabbitMQ server
    const rabbitMqConnectionString = `amqp://${config.rabbitmq.username}:${config.rabbitmq.password}@${config.rabbitmq.server}`
    amqp.connect(rabbitMqConnectionString, (err, conn) => {
      if (err) {
        console.error('ERROR when connecting to the RabbitMQ server')
        console.error(err)
      } else {
        conn.createChannel(function (err, ch) {
          if (err) {
            console.error('ERROR when trying to create a channel on the RabbitMQ server')
            console.error(err)
          }
          ch.assertQueue(queue, { durable: false })
          ch.assertExchange(exchange, 'topic')
          ch.bindQueue(queue, exchange, '#')
          ch.consume(queue, messageHandler, { noAck: true })
        })
      }
    })
  }

  mapVectorTileUuidToRoom (vtUuid, roomId) {
    this.vectorTileRequestToRoom[vtUuid] = roomId
  }

  broadcastMessage (msg) {
    // sending to all clients in namespace 'broadcast', including sender
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
