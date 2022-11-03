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

function createSocketManager() {

  const router = {}

  // hold the current namespace+room connections.
  // useful to re-connect to rooms after a socket disconnect/reconnect.
  const roomConnections = {}
  SocketNamespaces.forEach(socketNamespace => roomConnections[socketNamespace] = new Set())

  // initialize websocket
  const sockets = {}
  const ioObject = sockets.default = io()

  let sessionIdPromise = new Promise((resolve, reject) => {
    sockets.default.on('connect', () => {
      const sessionId = sockets.default.io.engine.id
      joinRoom('client', sessionId)
      resolve(sessionId)
    })
    sockets.default.on('connect_error', err => console.error(err))
  })

  // after a disconnect and reconnect, make sure that we re-subscribe to the older rooms and namespaces
  ioObject.on('connect_error', err => console.error(err))
  ioObject.on('connect_timeout', err => console.error(err))
  ioObject.on('reconnect_error', err => console.error(err))
  ioObject.on('reconnect_failed', () => console.error(`Fatal - unable to reconnect to websocket`))
  ioObject.on('reconnect', attempt => {
    console.log(`Successfully reconnected to websocket after ${attempt} attempts`)
    // This client will have previously joined the "client" namespace with a client id.
    // Leave this room, or else we will have multiple client namespace connections with the server.
    sessionIdPromise
      .then(sessionId => {
        console.log(`Leaving old client room with id ${sessionId}`)
        leaveRoom('client', sessionId)
      })
      .catch(err => console.error(err))
    // Rewrite the session id promise
    const sessionId = sockets.default.io.engine.id
    sessionIdPromise = Promise.resolve(sessionId)
    // Restore namespace+room connections.
    Object.keys(roomConnections).forEach(namespaceKey => {
      roomConnections[namespaceKey].forEach(room => joinRoom(namespaceKey, room))
    })
  })

  // Connect to all socket namespaces
  SocketNamespaces.forEach(socketNamespace => sockets[socketNamespace] = io(`/${socketNamespace}`))
  Object.keys(sockets).forEach(namespaceKey => {
    // broadcast has a different object structure, so it should be handled seperately
    if (namespaceKey !== 'broadcast') {
      sockets[namespaceKey].on('message', message => routeMessage(message))
    } else {
      sockets[namespaceKey].on('message', message => routeBrodcastMessage(message))
    }
  })

  function joinRoom(namespace, room) {
    sockets[namespace].emit('SOCKET_JOIN_ROOM', room)
    roomConnections[namespace].add(room)
  }

  function leaveRoom(namespace, room) {
    sockets[namespace].emit('SOCKET_LEAVE_ROOM', room)
    roomConnections[namespace].delete(room)
  }

  function subscribe(messageType, callback) {
    router[messageType] = router[messageType] || []
    router[messageType].push(callback)
    return () => unsubscribe(callback)
  }

  function unsubscribe(fn) {
    Object.keys(router).forEach(messageType => {
      let subscriberIndex = router[messageType].findIndex(item => item === fn)
      while (subscriberIndex >= 0) {
        router[messageType].splice(subscriberIndex)
        subscriberIndex = router[messageType].findIndex(item => item === fn)
      }
    })
  }

  function routeMessage(message) {
    const subscribers = router[message.properties.headers.eventType] || []
    subscribers.forEach(subscriber => subscriber(message))
  }

  // Route the Brodcast Message
  function routeBrodcastMessage(message) {
    const subscribers = router[message.type] || []
    subscribers.forEach(subscriber => subscriber(message))
  }

  return {
    sockets,
    getSessionId: () => sessionIdPromise,
    joinRoom,
    leaveRoom,
    subscribe,
  }
}

export const ClientSocketManager = createSocketManager()
