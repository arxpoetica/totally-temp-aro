const amqp = require('amqplib')
const Consumer = require('./consumer')
const helpers = require('../helpers')
const RETRY_CONNECTION_IN_MSEC = 10000

class MessageQueueManager {
  constructor (host, username, password) {
    // Save a connection string used to connect to the RabbitMQ (or any AMQP) server
    this.connectionString = `amqp://${username}:${password}@${host}`
    this.consumers = []
  }

  addConsumer (consumer) {
    if (!(consumer instanceof Consumer)) {
      helpers.logger.error('ERROR: In MessageQueueManager.addConsumer(), input must be an object of type Consumer. Consumer will not be added to list.')
      return
    }
    this.consumers.push({
      queue: consumer.queue,
      exchange: consumer.exchange,
      messageHandler: consumer.messageHandler
    })
  }

  connectToPublisher () {
    // Attempt to connect to the publisher
    helpers.logger.info('Attempting to connect to the RabbitMQ server')
    amqp.connect(this.connectionString)
      .then(connection => {
        helpers.logger.info('Successfully created a connection to the RabbitMQ server')
        connection.on('close', () => {
          helpers.logger.info(`RabbitMQ connection has closed. Attempting to reconnect in ${RETRY_CONNECTION_IN_MSEC} msec`)
          setTimeout(() => this.connectToPublisher(), RETRY_CONNECTION_IN_MSEC)
        })
        connection.on('error', err => {
          helpers.logger.error(`ERROR from RabbitMQ connection:`)
          helpers.logger.error(err)
        })
        return connection.createChannel()
      })
      .then(channel => {
        helpers.logger.info('Successfully created a channel with the RabbitMQ server')
        // Assert queues and set handlers for all the consumers
        this.consumers.forEach(consumer => {
          channel.assertQueue(consumer.queue, { durable: false })
          channel.assertExchange(consumer.exchange, 'topic')
          channel.bindQueue(consumer.queue, consumer.exchange, '#')
          channel.consume(consumer.queue, consumer.messageHandler, { noAck: true })
          helpers.logger.info(`Successfully set up a handler for consumer ${JSON.stringify(consumer)}`)
        })
      })
      .catch(err => {
        helpers.logger.error('ERROR when connecting to the RabbitMQ server')
        helpers.logger.error(err)
        helpers.logger.error(`Will attempt to reconnect to RabbitMQ server in ${RETRY_CONNECTION_IN_MSEC} msec`)
        setTimeout(() => this.connectToPublisher(), RETRY_CONNECTION_IN_MSEC)
      })
  }
}

module.exports = MessageQueueManager
