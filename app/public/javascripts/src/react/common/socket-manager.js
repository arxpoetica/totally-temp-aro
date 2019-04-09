import io from 'socket.io-client'

class SocketManager {
  constructor () {
    this.router = {}
    this.websocketSessionId = null
    this.socket = io()
    this.broadcastSocketnsp = io('/broadcastRoom')
    this.socket.on('message', message => this.routeMessage(message))
    this.broadcastSocketnsp.on('message', message => this.routeMessage(message))
  }

  initializeSession (websocketSessionId, userRole) {
    this.websocketSessionId = websocketSessionId
    this.joinRoom(websocketSessionId, userRole)
  }

  joinRoom (roomId, userRole) {
    this.socket.emit('SOCKET_JOIN_ROOM', roomId)
    this.broadcastSocketnsp.emit('SOCKET_BROADCAST_ROOM', userRole)
  }

  leaveRoom (roomId) {
    this.socket.emit('SOCKET_LEAVE_ROOM', roomId)
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
