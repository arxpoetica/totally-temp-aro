
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
      })

    })
  }
}

module.exports = Socket