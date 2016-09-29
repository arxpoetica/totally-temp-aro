var database = require('./database')

exports.serviceLayers = []
exports.analysisLayers = []

function readServiceLayers () {
  return database.query('SELECT * FROM client.service_layer ORDER BY id ASC')
    .then((response) => {
      exports.serviceLayers = response
      return database.query(`
        SELECT
          slnt.service_layer_id, slnt.description AS service_layer_node_name, nnt.id, nnt.name, nnt.description
          FROM client.service_layer_node_type slnt
          JOIN client.network_node_types nnt ON nnt.id = slnt.network_node_type_id
          WHERE is_displayed=true
      `)
    })
    .then((nodeTypes) => {
      exports.serviceLayers.forEach((layer) => {
        layer.nodeTypes = nodeTypes.filter((type) => type.service_layer_id === layer.id)
      })
    })
}

function readAnalysisLayers () {
  return database.query('SELECT * FROM client.analysis_layer ORDER BY id ASC')
    .then((response) => {
      exports.analysisLayers = response
    })
}

exports.refresh = () => {
  return Promise.all([
    readAnalysisLayers(),
    readServiceLayers()
  ])
  .then(() => console.log(`Cache loaded ${exports.serviceLayers.length} service areas, ${exports.analysisLayers.length} analysis layers`))
}

exports.refresh()
  .catch((err) => console.log('Error refreshing cache', err.stack))