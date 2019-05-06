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
    this.io = require('socket.io')(app)
    this.broadcastnsp = this.io.of('/broadcastRoom')
    this.setupConnectionhandlers()
    this.setupVectorTileAMQP()
    this.setupTileInvalidationAMQP()
  }

  setupConnectionhandlers () {
    this.io.on('connection', (socket) => {
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

    this.broadcastnsp.on('connection', (socket) => {
      socket.on('SOCKET_BROADCAST_ROOM', (roomId) => {
        console.log(`Joining Broadcast socket namespace: /broadcastRoom , room: /${roomId}`)
      })
    })
  }

  setupVectorTileAMQP () {
    // We will receive vector tile data via a RabbitMQ server
    var self = this
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
          ch.assertQueue(VECTOR_TILE_QUEUE, { durable: false })
          ch.assertExchange(VECTOR_TILE_EXCHANGE, 'topic')
          ch.bindQueue(VECTOR_TILE_QUEUE, VECTOR_TILE_EXCHANGE, '#')

          ch.consume(VECTOR_TILE_QUEUE, function (msg) {
            const uuid = JSON.parse(msg.content.toString()).uuid
            const roomId = self.vectorTileRequestToRoom[uuid]
            if (!roomId) {
              console.error(`ERROR: No socket roomId found for vector tile UUID ${uuid}`)
            } else {
              console.log(`Vector Tile Socket: Routing message with UUID ${uuid} to /${roomId}`)
              delete self.vectorTileRequestToRoom[uuid]
              self.io.to(`/${roomId}`).emit('message', { type: VECTOR_TILE_DATA_MESSAGE, data: msg })
            }
          }, { noAck: true })
        })
      }
    })
  }

  setupTileInvalidationAMQP () {
    // We will receive vector tile invalidation messages via a RabbitMQ server. These should be
    // broadcast to all connected clients
    var self = this
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
          ch.assertQueue(TILE_INVALIDATION_QUEUE, { durable: false })
          ch.assertExchange(TILE_INVALIDATION_EXCHANGE, 'topic')
          ch.bindQueue(TILE_INVALIDATION_QUEUE, TILE_INVALIDATION_EXCHANGE, '#')
          ch.consume(TILE_INVALIDATION_QUEUE, msg => {
            self.broadcastnsp.emit('message', {
              type: TILE_INVALIDATION_MESSAGE,
              payload: JSON.parse(msg.content.toString())
            })
          })
        })
      }
    })
  }

  mapVectorTileUuidToRoom (vtUuid, roomId) {
    this.vectorTileRequestToRoom[vtUuid] = roomId
  }

  broadcastMessage (msg) {
    // sending to all clients in namespace 'broadcastnsp', including sender
    this.broadcastnsp.emit('message', {
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
