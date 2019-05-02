const amqp = require('amqplib/callback_api')
const helpers = require('../helpers')
const config = helpers.config
const VECTOR_TILE_DATA_MESSAGE = 'VECTOR_TILE_DATA'
const VECTOR_TILE_EXCHANGE = 'aro_vt', VECTOR_TILE_QUEUE = 'vectorTileQueue'
const PROGRESS_MESSAGE = 'PROGRESS_MESSAGE_DATA'
const PROGRESS_EXCHANGE = 'aro_progress', PROGRESS_QUEUE = 'progressQueue'
const BROADCAST_MESSAGE = 'BROADCAST_MESSAGE'
class SocketManager {
  
  constructor(app) {
    this.vectorTileRequestToRoom = {}
    this.io = require('socket.io')(app)
    this.broadcastnsp = this.io.of('/broadcastRoom')
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

      socket.on('SOCKET_JOIN_PLAN_ROOM', (roomId) => {
        console.log(`Joining plan socket room: /${roomId}`)
        socket.join(`/${roomId}`)
      })
      socket.on('SOCKET_LEAVE_PLAN_ROOM', (roomId) => {
        console.log(`Leaving plan socket room: /${roomId}`)
        socket.leave(`/${roomId}`)
      })
    })

    this.broadcastnsp.on('connection', (socket) => {
      socket.on('SOCKET_BROADCAST_ROOM', (roomId) => {
        console.log(`Joining Broadcast socket namespace: /broadcastRoom , room: /${roomId}`)
        socket.join(`/${roomId}`)
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
      }else{
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

          // Create progress channel
          ch.assertQueue(PROGRESS_QUEUE, {durable: false})
          ch.assertExchange(PROGRESS_EXCHANGE, 'topic')
          ch.bindQueue(PROGRESS_QUEUE, PROGRESS_EXCHANGE, '#')
  
          ch.consume(PROGRESS_QUEUE, function(msg) {
            const processId = JSON.parse(msg.content.toString()).processId
            if (!processId) {
              console.error(`ERROR: No socket roomId found for processId ${processId}`)
            } else {
              console.log(`Optimization Progress Socket: Routing message with UUID ${processId} to /${processId}`)
              var data = JSON.parse(msg.content.toString())
              //UI dependent on optimizationState at so many places TODO: need to remove optimizationstate
              data.optimizationState = data.progress != 1 ? 'STARTED' : 'COMPLETED'
              self.io.to(`/${processId}`).emit('message', { type: PROGRESS_MESSAGE, data:  data})
            }
          }, {noAck: true})

        })
      }
    })
  }

  mapVectorTileUuidToRoom(vtUuid, roomId) {
    this.vectorTileRequestToRoom[vtUuid] = roomId
  }

  broadcastMessage(msg) {
    // sending to all clients in namespace 'broadcastnsp', including sender
    this.broadcastnsp.emit('message', {
      type: 'NOTIFICATION_SHOW',
      payload: msg
    })
    // sending to a specific room in a specific namespace, including sender
    // this.broadcastnsp.to('/allUsers').emit('message', { type: NOTIFICATION_SHOW, data: msg })
  }
}

let socketManager = null
module.exports = {
  initialize: app => socketManager = new SocketManager(app),
  socketManager: () => socketManager
}
