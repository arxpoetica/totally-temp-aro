const amqp = require('amqplib/callback_api')
const helpers = require('../helpers')
const config = helpers.config
const VECTOR_TILE_DATA_MESSAGE = 'VECTOR_TILE_DATA'
const VECTOR_TILE_EXCHANGE = 'aro_vt', VECTOR_TILE_QUEUE = 'vectorTileQueue'
class SocketManager {

  constructor(app) {
    this.vectorTileRequestToRoom = {}
    this.io = require('socket.io')(app)
    this.setupConnectionhandlers()
    this.setupVectorTileAMQP()
  }

  setupConnectionhandlers() {
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
  }

  setupVectorTileAMQP() {
    // We will receive vector tile data via a RabbitMQ server
    var self = this
    const rabbitMqConnectionString = `amqp://${config.rabbitmq.username}:${config.rabbitmq.password}@${config.rabbitmq.server}`
    amqp.connect(rabbitMqConnectionString, (err, conn) => {
      if (err) {
        console.error('ERROR when connecting to the RabbitMQ server')
        console.error(err)
      }
      conn.createChannel(function(err, ch) {
        if (err) {
          console.error('ERROR when trying to create a channel on the RabbitMQ server')
          console.error(err)
        }
        ch.assertQueue(VECTOR_TILE_QUEUE, {durable: false})
        ch.assertExchange(VECTOR_TILE_EXCHANGE, 'topic')
        ch.bindQueue(VECTOR_TILE_QUEUE, VECTOR_TILE_EXCHANGE, '#')

        ch.consume(VECTOR_TILE_QUEUE, function(msg) {
          const uuid = JSON.parse(msg.content.toString()).uuid
          const roomId = self.vectorTileRequestToRoom[uuid]
          if (!roomId) {
            console.error(`ERROR: No socket roomId found for vector tile UUID ${uuid}`)
          } else {
            console.log(`Vector Tile Socket: Routing message with UUID ${uuid} to /${roomId}`)
            delete self.vectorTileRequestToRoom[uuid]
            self.io.to(`/${roomId}`).emit('message', { type: VECTOR_TILE_DATA_MESSAGE, data: msg })
          }
        }, {noAck: true})
      })
    })
  }

  mapVectorTileUuidToRoom(vtUuid, roomId) {
    this.vectorTileRequestToRoom[vtUuid] = roomId
  }
}

let socketManager = null
module.exports = {
  initialize: app => socketManager = new SocketManager(app),
  socketManager: () => socketManager
}
