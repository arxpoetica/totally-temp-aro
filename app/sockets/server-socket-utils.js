import { createLogger, LOGGER_GROUPS } from '../helpers/logger.cjs'
const logger = createLogger(LOGGER_GROUPS.SOCKET, 'yellow')

export const Consumer = class Consumer {
  constructor (queue, exchange, messageHandler) {
    this.queue = queue
    this.exchange = exchange
    this.messageHandler = messageHandler
  }
}

export const socketLogger = (message, payload) => {
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
