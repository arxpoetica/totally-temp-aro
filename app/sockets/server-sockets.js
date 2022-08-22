/**
 * Server Socket Manager
 * 
 * NOTE ABOUT NAMESPACES / CHANNELS:
 * 
 * This is an ascending order of the number of users that the message
 * will potentially go to. Always try to stay low on the number of
 * messages (so "client" is far better than "broadcast"):
 *   - client:    Each client that connects to the server will do so with a
 *                    "<Websocket ID>". To post a message to a specific
 *                    client, use the "/<Websocket ID>" room in this namespace.
 *   - user:      A particular user, who may be logged in on multiple clients.
 *   - plan:      A particular plan, which can be open on multiple users sessions.
 *   - library:   A particular library, which can be referenced by a lot of users.
 *   - broadcast: Used for broadcasting user messages to all connected
 *                    clients. This is used when, say, an admin user
 *                    wants to send messages to all users.
 */

const { config: { rabbitmq } } = require('../helpers')
const MessageQueueManager = require('./message-queue-manager')
const { socketLogger, Consumer } = require('./server-socket-utils')
const { setSubscribers } = require('./server-subscribers')
const { CHANNEL_NAMES, SOCKET_EVENTS } = require('../socket-namespaces')

async function createServerSocketManager(server) {

  const io = require('socket.io')(server)

  // set up channels & logic to join/leave rooms
  // NOTE: channels are called namespaces in the docs
  // SEE: https://socket.io/docs/v2/namespaces/
  const channels = {}
  for (const channelName of Object.values(CHANNEL_NAMES)) {
    channels[channelName] = io.of(`/${channelName}`)
    socketLogger(`Setting up room join/leave for socket namespace ${channelName}`)
    channels[channelName].on('connection', socket => {
      socketLogger(`Client with id ${socket.client.id} connected to socket with namespace ${channelName}`)
      setSubscribers(channelName, socket, channels[channelName])
    })
  }

  const emitToClient = (clientId, payload) => {
    channels.client.to(clientId).emit('message', payload)
    // TODO: too much noise and not very useful. turn back on?
    // socketLogger(`SOCKET EMIT client: ${clientId}`, payload)
  }
  const emitToUser = (userId, payload) => {
    channels.user.to(userId).emit('message', payload)
    socketLogger(`SOCKET EMIT user: ${userId}`, payload)
  }
  const emitToPlan = (planId, payload) => {
    channels.plan.to(planId).emit('message', payload)
    socketLogger(`SOCKET EMIT plan: ${planId}`, payload)
  }
  const emitToLibrary = (libraryId, payload) => {
    channels.library.to(libraryId).emit('message', payload)
    socketLogger(`SOCKET EMIT library: ${libraryId}`, payload)
  }
  const emitToBroadcast = (payload) => {
    channels.broadcast.to('broadcast').emit('message', payload)
    socketLogger(`SOCKET EMIT broadcast to all`, payload)
  }
  const emitToLoggedInUser = (loggedInUserID, payload) => {
    channels.broadcast.to(loggedInUserID).emit('message', payload)
    socketLogger(`SOCKET EMIT broadcast to logged in users: ${loggedInUserID}`, payload)
  }

  // Set up a message queue manager to get messages from ARO-Service

  const vectorTileRequestToRoom = {}
  const messageQueueManager = new MessageQueueManager(rabbitmq.server, rabbitmq.username, rabbitmq.password)

  // set up a connection to the aro-service RabbitMQ server for getting
  // vector tile data. This function is also responsible for routing
  // the vector tile data to the correct connected client.
  messageQueueManager.addConsumer(new Consumer('vectorTile', 'aro_vt', msg => {
    const uuid = JSON.parse(msg.content.toString()).uuid
    const clientId = vectorTileRequestToRoom[uuid]
    if (!clientId) {
      console.error(`ERROR: No socket clientId found for vector tile UUID ${uuid}`)
    } else {
      // TODO: too much noise...turning off for now...
      // socketLogger(`Vector Tile Socket: Routing message with UUID ${uuid} to /${clientId}`)
      delete vectorTileRequestToRoom[uuid]
      msg.properties.headers.eventType = 'VECTOR_TILE_DATA'
      emitToClient(clientId, msg)
    }
  }))

  // set up a connection to the aro-service RabbitMQ server for getting
  // vector tile invalidation data. These messages should be broadcast
  // to all connected clients (via the tileInvalidation namespace).
  messageQueueManager.addConsumer(new Consumer('tileInvalidation', 'tile_invalidation', msg => {
    socketLogger('Received tile invalidation message from service')
    socketLogger(msg.content.toString())
    msg.properties.headers.eventType = 'TILES_INVALIDATED'
    channels.tileInvalidation.emit('message', msg)
  }))

  messageQueueManager.addConsumer(new Consumer('progress', 'aro_progress', msg => {
    const processId = JSON.parse(msg.content.toString()).processId
    if (!processId) {
      console.error(`ERROR: No socket roomId found for processId ${processId}`)
    } else {
      socketLogger(`Optimization Progress Socket: Routing message with UUID ${processId} to plan/${processId}`)
      socketLogger(`SOCKET EMIT plan:${processId}`, JSON.stringify(msg))
      msg.properties.headers.eventType = 'PROGRESS_MESSAGE_DATA'
      // UI dependent on optimizationState at so many places TODO: need to remove optimizationstate
      msg.data = JSON.parse(msg.content.toString()) // Shove it in here for now. Its in too many places in the front end.
      msg.data.progress = (msg.data.jobsCompleted + 1) / (msg.data.totalJobs + 1)
      if (!msg.data.optimizationState) {
        if (msg.data.jobsCancelled) {
          msg.data.optimizationState = 'CANCELED'
        } else if (msg.data.jobsFailed) {
          msg.data.optimizationState = 'FAILED'
        } else {
          msg.data.optimizationState = 'STARTED'
        }
      }
      emitToPlan(processId, msg)
    }
  }))

  messageQueueManager.addConsumer(new Consumer('planEvent', 'plan_event', msg => {
    emitToPlan(msg.properties.headers.planId, msg)
  }))

  messageQueueManager.addConsumer(new Consumer('libraryEvent', 'library_event', msg => {
    emitToLibrary(msg.properties.headers.libraryId, msg)
  }))

  messageQueueManager.addConsumer(new Consumer('subnetEvent', 'subnet', msg => {
    socketLogger('Received subnet message from service', msg.content.toString())
    msg.properties.headers.eventType = 'SUBNET_DATA'
    emitToClient(msg.properties.headers.sessionId, msg)
  }))

  messageQueueManager.addConsumer(new Consumer('competitionUpdatesEvent', 'competition-updates', msg => {
    console.log({ msg: msg.content.toString() })
    socketLogger('Received subnet message from service', msg.content.toString())
    emitToBroadcast({
      type: SOCKET_EVENTS.COMPETITION_UPDATES,
      payload: msg.content.toString(),
    })
  }))

  messageQueueManager.connectToPublisher()

  return {
    // map a vector tile request UUID to a client id
    mapVectorTileUuidToClientId: (vtUuid, clientId) => {
      vectorTileRequestToRoom[vtUuid] = clientId
    },
    emitToClient,
    emitToUser,
    emitToPlan,
    emitToLibrary,
    emitToBroadcast,
    emitToLoggedInUser,
  }

}

module.exports.initServerSockets = async(server) => {
  return await createServerSocketManager(server)
}
