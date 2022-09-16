const { createLogger, LOGGER_GROUPS } = require('../helpers/logger')
const logger = createLogger(LOGGER_GROUPS.SOCKET, 'yellow')

module.exports.Consumer = class Consumer {
  constructor (queue, exchange, messageHandler) {
    this.queue = queue
    this.exchange = exchange
    this.messageHandler = messageHandler
  }
}

module.exports.socketLogger = (message, payload) => {
  // return
  if (payload) {
    const toLog = JSON.stringify(payload, (key, value) => {
      if (key === 'content') {
        return {
          type: value.type,
          data: `Length: ${value.data.length}`
        }
      }
      return value
    }, 2)
    logger.info(message, `payload: ${toLog}`)
  } else {
    logger.info(message)
  }
}
