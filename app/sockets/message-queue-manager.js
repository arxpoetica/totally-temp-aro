import amqp from 'amqplib'
import { createLogger, LOGGER_GROUPS } from '../helpers/logger.cjs'
import { Consumer } from './server-socket-utils.js'

const logger = createLogger(LOGGER_GROUPS.RABBIT_MQ)
const RETRY_CONNECTION_IN_MSEC = 10000

class MessageQueueManager {
  constructor (host, username, password) {
    // Save a connection string used to connect to the RabbitMQ (or any AMQP) server
    this.connectionString = `amqp://${username}:${password}@${host}`
    this.consumers = []
  }

  addConsumer (consumer) {
    if (!(consumer instanceof Consumer)) {
      logger.error('In MessageQueueManager.addConsumer(), input must be an object of type Consumer. Consumer will not be added to list.')
      return
    }
    this.consumers.push({
      queue: consumer.queue,
      exchange: consumer.exchange,
      messageHandler: consumer.messageHandler
    })
  }

  async connectToPublisher() {
    // Attempt to connect to the publisher
    logger.info('Attempting to connect to the RabbitMQ server')
    try {
        const connection = await amqp.connect(this.connectionString)
        logger.info('Successfully created a connection to the RabbitMQ server')
        connection.on('close', () => {
          logger.info(`RabbitMQ connection has closed. Attempting to reconnect in ${RETRY_CONNECTION_IN_MSEC} msec`)
          setTimeout(() => this.connectToPublisher(), RETRY_CONNECTION_IN_MSEC)
        })
        connection.on('error', err => {
          logger.error(`From RabbitMQ connection:`)
          logger.error(err)
        })
        const channel = await connection.createChannel()
        logger.info('Successfully created a channel with the RabbitMQ server')
        // Assert queues and set handlers for all the consumers
        this.consumers.forEach(consumer => {
          channel.assertQueue(consumer.queue, { durable: false })
          channel.assertExchange(consumer.exchange, 'topic')
          channel.bindQueue(consumer.queue, consumer.exchange, '#')
          channel.consume(consumer.queue, consumer.messageHandler, { noAck: true })
          logger.info(`Successfully set up a handler for consumer ${JSON.stringify(consumer)}`)
        })
    } catch (error) {
      logger.error('When connecting to the RabbitMQ server')
      logger.error(error)
      logger.status(`Will attempt to reconnect to RabbitMQ server in ${RETRY_CONNECTION_IN_MSEC} msec`)
      setTimeout(() => this.connectToPublisher(), RETRY_CONNECTION_IN_MSEC)
    }
  }
}

export default MessageQueueManager
