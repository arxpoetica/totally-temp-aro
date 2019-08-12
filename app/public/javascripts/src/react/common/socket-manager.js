import io from 'socket.io-client'
import SocketNamespaces from './socket-namespaces'

class SocketManager {
  constructor () {
    this.router = {}

    // Initialize websocket
    this.sockets = {}
    this.sockets.default = io()
    this.sessionIdPromise = new Promise((resolve, reject) => {
      this.sockets.default.on('connect', () => {
        const sessionId = this.sockets.default.io.engine.id
        this.joinRoom('client', sessionId)
        resolve(sessionId)
      })
      this.sockets.default.on('connect_error', err => console.error(err)) // Not sure if I should reject here - what if it tries to reconnect?
    })

    // Connect to all socket namespaces
    SocketNamespaces.forEach(socketNamespace => {
      this.sockets[socketNamespace] = io(`/${socketNamespace}`)
    })
    Object.keys(this.sockets).forEach(namespaceKey => {
      this.sockets[namespaceKey].on('message', message => this.routeMessage(message))
    })
  }

  joinRoom (namespace, room) {
    this.sockets[namespace].emit('SOCKET_JOIN_ROOM', room)
  }

  leaveRoom (namespace, room) {
    this.sockets[namespace].emit('SOCKET_LEAVE_ROOM', room)
  }

  getSessionId () {
    return this.sessionIdPromise
  }

  subscribe (messageType, callback) {
    this.router[messageType] = this.router[messageType] || []
    this.router[messageType].push(callback)
    return () => this.unsubscribe(callback)
  }

  unsubscribe (fn) {
    console.log('unsubscribe')
    Object.keys(this.router).forEach(messageType => {
      var subscriberIndex = this.router[messageType].findIndex(item => item === fn)
      while (subscriberIndex >= 0) {
        this.router[messageType].splice(subscriberIndex)
        subscriberIndex = this.router[messageType].findIndex(item => item === fn)
      }
    })
  }

  routeMessage (message) {
    const subscribers = this.router[message.properties.headers.eventType] || []
    subscribers.forEach(subscriber => subscriber(message))
  }
}

let socketManager = new SocketManager()

export default socketManager // Note we are exporting the instance and not the class
