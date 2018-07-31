var helpers = require('../helpers')
var cache = helpers.cache
var public_config = helpers.public_config

exports.configure = (api, middleware) => {
  api.get('/', (request, response, next) => {
    response.render('index.html', {
      env: process.env.NODE_ENV,
      env_is_production: process.env.NODE_ENV === 'production',
      env_is_test: process.env.NODE_ENV === 'test',
      user: request.user,
      config: public_config,
      serviceLayers: cache.serviceLayers,
      analysisLayers: cache.analysisLayers,
      mapType: process.env.ARO_CLIENT === 'frontier' ? 'SATELLITE' : 'ROADMAP', 
      // For google maps licensing, specify one of the following:
      // 1. Nothing (no API_KEY, no CLIENT_ID, no CHANNEL)
      // 2. API_KEY only
      // 3. CLIENT_ID only
      // 4. CHANNEL and CLIENT_ID only
      googleMapsLicensing: {
        API_KEY: process.env.GOOGLE_MAPS_API_KEY,
        CLIENT_ID: process.env.GOOGLE_MAPS_CLIENT_ID,
        CHANNEL: process.env.GOOGLE_MAPS_CHANNEL
      }
    })
  })
}
