import io from 'socket.io-client'

const SocketNamespaces = Object.freeze([
  'client',
  'plan',
  'user',
  'library',
  'broadcast',
  'tileInvalidation',
  'subnet',
])

class _SocketManager {
  constructor () {
    this.router = {}

    // Hold the current namespace+room connections. Useful to re-connect to rooms after a socket disconnect/reconnect.
    this.roomConnections = {}
    SocketNamespaces.forEach(socketNamespace => {
      this.roomConnections[socketNamespace] = new Set()
    })

    // Initialize websocket
    this.sockets = {}
    this.sockets.default = io()
    this.setupResilientConnection(this.sockets.default)
    this.sessionIdPromise = new Promise((resolve, reject) => {
      this.sockets.default.on('connect', () => {
        const sessionId = this.sockets.default.io.engine.id
        this.joinRoom('client', sessionId)
        resolve(sessionId)
      })
      this.sockets.default.on('connect_error', err => console.error(err))
    })

    // Connect to all socket namespaces
    SocketNamespaces.forEach(socketNamespace => {
      this.sockets[socketNamespace] = io(`/${socketNamespace}`)
    })
    Object.keys(this.sockets).forEach(namespaceKey => {
      // broadcast has a different object structure, so it should be handled seperately
      if (namespaceKey !== 'broadcast') {
        this.sockets[namespaceKey].on('message', message => this.routeMessage(message))
      } else {
        this.sockets[namespaceKey].on('message', message => this.routeBrodcastMessage(message))
      }
    })
  }

  joinRoom (namespace, room) {
    this.sockets[namespace].emit('SOCKET_JOIN_ROOM', room)
    this.roomConnections[namespace].add(room)
  }

  leaveRoom (namespace, room) {
    this.sockets[namespace].emit('SOCKET_LEAVE_ROOM', room)
    this.roomConnections[namespace].delete(room)
  }

  // After a disconnect and reconnect, make sure that we re-subscribe to the older rooms and namespaces
  setupResilientConnection (ioObject) {
    ioObject.on('connect_error', err => { console.error(err) })
    ioObject.on('connect_timeout', err => { console.error(err) })
    ioObject.on('reconnect_error', err => { console.error(err) })
    ioObject.on('reconnect_failed', () => { console.error(`Fatal - unable to reconnect to websocket`) })
    ioObject.on('reconnect', attempt => {
      console.log(`Successfully reconnected to websocket after ${attempt} attempts`)
      // This client will have previously joined the "client" namespace with a client id.
      // Leave this room, or else we will have multiple client namespace connections with the server.
      this.sessionIdPromise
        .then(sessionId => {
          console.log(`Leaving old client room with id ${sessionId}`)
          this.leaveRoom('client', sessionId)
        })
        .catch(err => console.error(err))
      // Rewrite the session id promise
      const sessionId = this.sockets.default.io.engine.id
      this.sessionIdPromise = Promise.resolve(sessionId)
      // Restore namespace+room connections.
      Object.keys(this.roomConnections).forEach(namespaceKey => {
        this.roomConnections[namespaceKey].forEach(room => this.joinRoom(namespaceKey, room))
      })
    })
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
    Object.keys(this.router).forEach(messageType => {
      let subscriberIndex = this.router[messageType].findIndex(item => item === fn)
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

  // Route the Brodcast Message
  routeBrodcastMessage (message) {
    const subscribers = this.router[message.type] || []
    subscribers.forEach(subscriber => subscriber(message))
  }
}

// NOTE: we are exporting the instance and not the class
export const SocketManager = new _SocketManager()
