const REDUX_COMMAND_MESSAGE = 'REDUX_COMMAND'

class Socket {

  constructor(app) {
    this.io = require('socket.io')(app)
    // this.interval = setInterval(() => {
    //   console.log('sending message...')
    //   this.io.to(`/plan/1`).emit('message', Math.random())
    // }, 2000)

    this.setupConnectionhandlers()
  }

  setupConnectionhandlers() {

    this.io.on('connection', (socket) => {
      console.log(`Connected socket with session id ${socket.client.id}`)

      socket.on('SOCKET_SUBSCRIBE_TO_ROOM', (roomId) => {
        console.log(`Joining socket room: ${roomId}`)
        socket.join(roomId)
        socket.join('/plan')  // For debugging only
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