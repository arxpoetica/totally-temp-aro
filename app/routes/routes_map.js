var helpers = require('../helpers')
var database = helpers.database
var public_config = helpers.public_config

var serviceLayers = []

database.query('SELECT * FROM client.service_layer ORDER BY id ASC')
  .then((response) => {
    serviceLayers = response
    return database.query(`
      SELECT
        slnt.service_layer_id, slnt.description AS service_layer_node_name, nnt.id, nnt.name, nnt.description
        FROM client.service_layer_node_type slnt
        JOIN client.network_node_types nnt ON nnt.id = slnt.network_node_type_id
        WHERE is_displayed=true
    `)
  })
  .then((nodeTypes) => {
    serviceLayers.forEach((layer) => {
      layer.nodeTypes = nodeTypes.filter((type) => type.service_layer_id === layer.id)
    })
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
