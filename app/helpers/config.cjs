const path = require('path')
const deepmerge = require('deepmerge')
const { createLogger, LOGGER_GROUPS } = require('./logger.cjs')
const logger = createLogger(LOGGER_GROUPS.CONFIG)

var aro_client = process.env.ARO_CLIENT || ''
var extension = (aro_client && '_' + aro_client) + '.json'

var filename = path.join(__dirname, '..', '..', 'conf', 'config_app' + extension)
const defaultConfiguration = require(path.join(__dirname, '..', '..', 'conf', 'config_app_default.json'))

var configuration = null

try {
  configuration = deepmerge(defaultConfiguration, require(filename))
  logger.info(`Loaded ${filename} successfully`)
} catch (e) {
  // default configuration
  configuration = defaultConfiguration
  logger.error(`File ${filename} not found. Using default configuration file ${defaultConfiguration}`)
}

configuration.base_url = process.env.APP_BASE_URL || 'http://localhost:8000'
configuration.aro_service_url = process.env.ARO_SERVICE_URL || configuration.aro_service_url
configuration.oauth_server_host = process.env.OAUTH_SERVER_HOST || configuration.oauth_server_host
configuration.rabbitmq = {
  server: process.env.RABBITMQ_SERVER || 'rabbitmq',
  username: process.env.RABBITMQ_USERNAME || 'guest',
  password: process.env.RABBITMQ_PASSWORD || 'guest'
}
configuration.map_reports_url = process.env.MAP_REPORTS_URL || 'http://reportsrv:7000'

module.exports = configuration
