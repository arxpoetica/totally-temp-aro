class Consumer {
  constructor (queue, exchange, messageHandler) {
    this.queue = queue
    this.exchange = exchange
    this.messageHandler = messageHandler
  }
}

module.exports = Consumer
