const path = require('path')
const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

var errorLogFile = path.join(__dirname, '..', '..', 'logs', 'aro-app.error')
var logFile = path.join(__dirname, '..', '..', 'logs', 'aro-app.log')
const MAX_FILES = '15d'

// Create a logger that logs
// 1. Everything to the console
// 2. Everything to a log file that is rotated daily
// 3. Errors to a error log file that is rotated daily
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ json: false, format: winston.format.simple() }),
    new DailyRotateFile({ filename: logFile, maxFiles: MAX_FILES }),
    new DailyRotateFile({ filename: errorLogFile, maxFiles: MAX_FILES, level: 'error' })
  ]
})

logger.stream = {
  write: info => logger.info(info)
}

module.exports = logger
