class Sockets {
  constructor (app) {
    // Socket namespaces:
    // clients: Each client that connects to the server will do so with a "<Websocket ID>". To post a message to a specific
    //          client, use the "/<Websocket ID>" room in this namespace.
    // broadcast: Used for broadcasting user messages to all connected clients. This is used when, say, an admin user
    //            wants to send messages to all users.
    // tileInvalidation: Used to send vector tile invalidation messages to all clients listening on the namespace.
    const socket = require('socket.io')(app)
    this.clients = socket.of('/clients')
    this.plans = socket.of('/plans')
    this.broadcast = socket.of('/broadcast')
    this.tileInvalidation = socket.of('/tileInvalidation')
  }
}

module.exports = Sockets
