var helpers = require('../helpers')
var database = helpers.database
var public_config = helpers.public_config

var serviceLayers = []

database.query('SELECT * FROM client.service_layer ORDER BY description ASC')
  .then((response) => {
    serviceLayers = response
  })
  .catch((err) => console.log('Error querying service_layers', err.stack))

exports.configure = (api, middleware) => {
  api.get('/', (request, response, next) => {
    response.render('index.html', {
      env: process.env.NODE_ENV,
      env_is_production: process.env.NODE_ENV === 'production',
      env_is_test: process.env.NODE_ENV === 'test',
      user: request.user,
      config: public_config,
      serviceLayers: serviceLayers
    })
  })
}
