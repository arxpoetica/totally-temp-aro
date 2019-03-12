const path = require('path')
const deepmerge = require('deepmerge')

var aro_client = process.env.ARO_CLIENT || ''
var extension = (aro_client && '_' + aro_client) + '.json'

var filename = path.join(__dirname, '..', '..', 'conf', 'config_app' + extension)
const defaultConfiguration = require(path.join(__dirname, '..', '..', 'conf', 'config_app_default.json'))

var configuration = null

try {
  configuration = deepmerge(defaultConfiguration, require(filename))
  console.log('Loaded', filename, 'successfully')
} catch (e) {
  // default configuration
  configuration = defaultConfiguration
  console.log('File', filename, 'not found. Using default configuration file', defaultConfiguration)
}

configuration.base_url = process.env.APP_BASE_URL || 'http://localhost:8000'
configuration.aro_service_url = process.env.ARO_SERVICE_URL || configuration.aro_service_url
configuration.OAUTH_CLIENT = process.env.OAUTH_CLIENT || 'acme'
configuration.OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || 'acmesecret'

module.exports = configuration