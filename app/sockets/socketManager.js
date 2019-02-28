const amqp = require('amqplib/callback_api')
const VECTOR_TILE_DATA_MESSAGE = 'VECTOR_TILE_DATA'
const vtExchangeName = 'aro_vt', vtQueueName = 'vectorTileQueue'

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
    var self = this
    amqp.connect('amqp://guest:guest@rabbitmq/', (err, conn) => {
      conn.createChannel(function(err, ch) {
        ch.assertQueue(vtQueueName, {durable: false})
        ch.assertExchange(vtExchangeName, 'topic')
        ch.bindQueue(vtQueueName, vtExchangeName, '#')

        ch.consume(vtQueueName, function(msg) {
          const uuid = JSON.parse(msg.content.toString()).uuid
          const roomId = self.vectorTileRequestToRoom[uuid]
          delete self.vectorTileRequestToRoom[uuid]
          self.io.to(`/${roomId}`).emit('message', { type: VECTOR_TILE_DATA_MESSAGE, data: msg })
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
