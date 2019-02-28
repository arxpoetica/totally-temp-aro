var path = require('path')

var aro_client = process.env.ARO_CLIENT || ''
var extension = (aro_client && '_' + aro_client) + '.json'

var filename = path.join(__dirname, '..', '..', 'conf', 'config_app' + extension)
var def_conf = path.join(__dirname, '..', '..', 'conf', 'config_app_default.json')

try {
  module.exports = require(filename)
  console.log('Loaded', filename, 'successfully')
} catch (e) {
  // default configuration
  module.exports = require(def_conf)
  console.log('File', filename, 'not found. Using default configuration file', def_conf)
}

module.exports.base_url = process.env.APP_BASE_URL || 'http://localhost:8000'
module.exports.aro_service_url = process.env.ARO_SERVICE_URL || module.exports.aro_service_url
module.exports.rabbitmq = {
  server: process.env.RABBITMQ_SERVER || 'rabbitmq',
  username: process.env.RABBITMQ_USERNAME || 'guest',
  password: process.env.RABBITMQ_PASSWORD || 'guest'
}