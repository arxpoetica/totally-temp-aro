import io from 'socket.io-client'

class SocketManager {
  constructor () {
    this.router = {}
    this.websocketSessionId = null
    this.sockets = {
      default: io(),
      broadcast: io('/broadcast'),
      tileInvalidation: io('/tileInvalidation')
    }
    Object.keys(this.sockets).forEach(namespaceKey => {
      this.sockets[namespaceKey].on('message', message => this.routeMessage(message))
    })
  }

  initializeSession (websocketSessionId) {
    this.websocketSessionId = websocketSessionId
    this.joinRoom(websocketSessionId)
  }

  joinRoom (roomId) {
    this.sockets.default.emit('SOCKET_JOIN_ROOM', roomId)
  }

  leaveRoom (roomId) {
    this.sockets.default.emit('SOCKET_LEAVE_ROOM', roomId)
  }

  subscribe (messageType, callback) {
    this.router[messageType] = this.router[messageType] || []
    this.router[messageType].push(callback)
    return () => this.unsubscribe(callback)
  }

  unsubscribe (fn) {
    Object.keys(this.router).forEach(messageType => {
      var subscriberIndex = this.router[messageType].findIndex(item => item === fn)
      while (subscriberIndex >= 0) {
        this.router[messageType].splice(subscriberIndex)
        subscriberIndex = this.router[messageType].findIndex(item => item === fn)
      }
    })
  }

  routeMessage (message) {
    const subscribers = this.router[message.type] || []
    subscribers.forEach(subscriber => subscriber(message))
  }
}

let socketManager = new SocketManager()

export default socketManager // Note we are exporting the instance and not the class
