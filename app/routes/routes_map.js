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
      analysisLayers: cache.analysisLayers
    })
  })
}
