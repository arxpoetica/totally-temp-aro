const amqp = require('amqplib/callback_api')
const REDUX_COMMAND_MESSAGE = 'REDUX_COMMAND'
const VECTOR_TILE_DATA_MESSAGE = 'VECTOR_TILE_DATA'
const vtExchangeName = 'aro_vt', vtQueueName = 'vectorTileQueue'

class Socket {

  constructor(app) {
    this.io = require('socket.io')(app)
    // this.interval = setInterval(() => {
    //   console.log('sending message...')
    //   this.io.to(`/plan/1`).emit('message', Math.random())
    // }, 2000)

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
          self.io.to('/vectorTiles').emit('message', { type: VECTOR_TILE_DATA_MESSAGE, data: msg })
        }, {noAck: true})
      })
    })
}

  // Mock - For coverage report endpoints, start simulating websocket responses
  mockCoverageEndpoint() {
    var progress = 0
    this.io.to(`/plan`).emit(REDUX_COMMAND_MESSAGE, {
      type: 'COVERAGE_SET_STATUS',
      payload: { status: 'RUNNING' }
    })
    var progressInterval = setInterval(() => {
      this.io.to(`/plan`).emit(REDUX_COMMAND_MESSAGE, {
        type: 'COVERAGE_SET_PROGRESS',
        payload: { progress: progress }
      })
      progress += 0.1
      if (progress >= 1.0) {
        clearInterval(progressInterval)
        this.io.to(`/plan`).emit(REDUX_COMMAND_MESSAGE,
          {
            type: 'COVERAGE_SET_STATUS',
            payload: { status: 'FINISHED' }
          })
      }
    }, 1000)
  }

}

module.exports = Socket