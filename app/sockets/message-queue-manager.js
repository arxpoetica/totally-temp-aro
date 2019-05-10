const amqp = require('amqplib')
const RETRY_CONNECTION_IN_MSEC = 5000

class MessageQueueManager {
  constructor (host, username, password) {
    // Save a connection string used to connect to the RabbitMQ (or any AMQP) server
    this.connectionString = `amqp://${username}:${password}@${host}`
    this.consumers = []
  }

  addConsumer (queue, exchange, messageHandler) {
    this.consumers.push({
      queue: queue,
      exchange: exchange,
      messageHandler: messageHandler
    })
  }

  connectToPublisher () {
    // Attempt to connect to the publisher
    console.log('Attempting to connect to the RabbitMQ server')
    amqp.connect(this.connectionString)
      .then(connection => {
        console.log('Successfully created a connection to the RabbitMQ server')
        connection.on('close', () => {
          console.log(`RabbitMQ connection has closed. Attempting to reconnect in ${RETRY_CONNECTION_IN_MSEC} msec`)
          setTimeout(() => this.connectToPublisher(), RETRY_CONNECTION_IN_MSEC)
        })
        return connection.createChannel()
      })
      .then(channel => {
        console.log('Successfully created a channel with the RabbitMQ server')
        // Assert queues and set handlers for all the consumers
        this.consumers.forEach(consumer => {
          channel.assertQueue(consumer.queue, { durable: false })
          channel.assertExchange(consumer.exchange, 'topic')
          channel.bindQueue(consumer.queue, consumer.exchange, '#')
          channel.consume(consumer.queue, consumer.messageHandler, { noAck: true })
          console.log(`Successfully set up a handler for consumer ${JSON.stringify(consumer)}`)
        })
      })
      .catch(err => {
        console.error('ERROR when connecting to the RabbitMQ server')
        console.error(err)
        console.error(`Will attempt to reconnect to RabbitMQ server in ${RETRY_CONNECTION_IN_MSEC} msec`)
        setTimeout(() => this.connectToPublisher(), RETRY_CONNECTION_IN_MSEC)
      })
  }
}

module.exports = MessageQueueManager
