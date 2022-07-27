const helpers = require('../helpers')
const Sockets = require('./sockets')
const MessageQueueManager = require('./message-queue-manager')
const Consumer = require('./consumer')
const config = helpers.config
const socketConfig = Object.freeze({
  vectorTile: {
    message: 'VECTOR_TILE_DATA',
    exchange: 'aro_vt',
    queue: 'vectorTile'
  },
  invalidation: {
    message: 'TILES_INVALIDATED',
    exchange: 'tile_invalidation',
    queue: 'tileInvalidation'
  },
  competitionUpdates: {
    message: 'COMPETITION_UPDATES',
    exchange: 'competition-updates',
    queue: 'competitionUpdates'
  },
  progress: {
    message: 'PROGRESS_MESSAGE_DATA',
    exchange: 'aro_progress',
    queue: 'progress'
  },
  plan: {
    exchange: 'plan_event',
    queue: 'planEvent'
  },
  library: {
    exchange: 'library_event',
    queue: 'libraryEvent'
  },
  subnet: {
    exchange: 'subnet',
    queue: 'subnetEvent'
  },
})

class SocketManager {
  constructor (app) {
    this.vectorTileRequestToRoom = {}
    this.sockets = new Sockets(app)

    // Set up a message queue manager to get messages from ARO-Service
    const messageQueueManager = new MessageQueueManager(config.rabbitmq.server, config.rabbitmq.username, config.rabbitmq.password)
    messageQueueManager.addConsumer(this.getVectorTileConsumer())
    messageQueueManager.addConsumer(this.getTileInvalidationConsumer())
    messageQueueManager.addConsumer(this.getOptimizationProgressConsumer())
    messageQueueManager.addConsumer(this.getPlanEventConsumer())
    messageQueueManager.addConsumer(this.getLibraryEventConsumer())
    messageQueueManager.addConsumer(this.getSubnetConsumer())
    messageQueueManager.addConsumer(this.getCompetitionUpdatesConsumer())
    messageQueueManager.connectToPublisher()
  }

  // Set up a connection to the aro-service RabbitMQ server for getting vector tile data. This function is also
  // responsible for routing the vector tile data to the correct connected client.
  getVectorTileConsumer () {
    return new Consumer(socketConfig.vectorTile.queue, socketConfig.vectorTile.exchange, msg => {
      const uuid = JSON.parse(msg.content.toString()).uuid
      const clientId = this.vectorTileRequestToRoom[uuid]
      if (!clientId) {
        console.error(`ERROR: No socket clientId found for vector tile UUID ${uuid}`)
      } else {
        console.log(`Vector Tile Socket: Routing message with UUID ${uuid} to /${clientId}`)
        delete this.vectorTileRequestToRoom[uuid]
        msg.properties.headers.eventType = socketConfig.vectorTile.message
        this.sockets.emitToClient(clientId, msg)
      }
    })
  }

  // Map a vector tile request UUID to a client ID.
  mapVectorTileUuidToClientId (vtUuid, clientId) {
    this.vectorTileRequestToRoom[vtUuid] = clientId
  }

  // Set up a connection to the aro-service RabbitMQ server for getting vector tile invalidation data. These messages
  // should be broadcast to all connected clients (via the tileInvalidation namespace).
  getTileInvalidationConsumer () {
    return new Consumer(socketConfig.invalidation.queue, socketConfig.invalidation.exchange, msg => {
      console.log('Received tile invalidation message from service')
      console.log(msg.content.toString())
      msg.properties.headers.eventType = socketConfig.invalidation.message
      this.sockets.sockets.tileInvalidation.emit('message', msg)
    })
  }

  getOptimizationProgressConsumer () {
    // Create progress channel
    return new Consumer(socketConfig.progress.queue, socketConfig.progress.exchange, msg => {
      const processId = JSON.parse(msg.content.toString()).processId
      if (!processId) {
        console.error(`ERROR: No socket roomId found for processId ${processId}`)
      } else {
        console.log(`Optimization Progress Socket: Routing message with UUID ${processId} to plan/${processId}`)
        console.log(`SOCKET EMIT plan:${processId}, payload: ${JSON.stringify(msg)}`)
        msg.properties.headers.eventType = socketConfig.progress.message
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
        this.sockets.emitToPlan(processId, msg)
      }
    })
  }

  getPlanEventConsumer () {
    const messageHandler = msg => {
      this.sockets.emitToPlan(msg.properties.headers.planId, msg)
    }
    return new Consumer(socketConfig.plan.queue, socketConfig.plan.exchange, messageHandler)
  }

  getLibraryEventConsumer () {
    return new Consumer(socketConfig.library.queue, socketConfig.library.exchange, msg => {
      this.sockets.emitToLibrary(msg.properties.headers.libraryId, msg)
    })
  }

  getSubnetConsumer () {
    return new Consumer(socketConfig.subnet.queue, socketConfig.subnet.exchange, msg => {
      console.log('Received subnet message from service')
      console.log(msg.content.toString())
      msg.properties.headers.eventType = 'SUBNET_DATA'
      this.sockets.emitToClient(msg.properties.headers.sessionId, msg)
    })
  }

  getCompetitionUpdatesConsumer () {
    return new Consumer(socketConfig.competitionUpdates.queue, socketConfig.competitionUpdates.exchange, msg => {
      console.log('Received competitionUpdates message from service')
      console.log(msg.content.toString())
      console.log(msg.properties.headers, msg.content)
      msg.properties.headers.eventType = socketConfig.competitionUpdates.message
      this.sockets.emitToCompetitionResourceManagerUsers(JSON.parse(msg.content.toString()).managerId, msg)
    })
  }

  broadcastMessage (msg) {
    // Sending to loggedInUser in namespace 'broadcast'
    this.sockets.emitToLoggedInUser(msg.loggedInUserID, {
      type: 'NOTIFICATION_SHOW',
      payload: msg
    })
  }
}

let socketManager = null
module.exports = {
  initialize: app => { socketManager = new SocketManager(app) },
  socketManager: () => socketManager,
}
