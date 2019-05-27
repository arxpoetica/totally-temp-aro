var database = require('./database')
const UIConfigurationClass = require('./ui_configuration')
const UIConfiguration = new UIConfigurationClass()

exports.serviceLayers = []
exports.analysisLayers = []
exports.fiberTypes = []

function loadFiberTypes () {
  return database.query('SELECT * FROM client.fiber_route_type')
    .then((rows) => { exports.fiberTypes = rows })
}

function loadServiceLayers () {
  return database.query('SELECT * FROM client.service_layer WHERE is_user_defined=false ORDER BY id ASC')
    .then((response) => {
      exports.serviceLayers = response
      return database.query(`
        SELECT
          slnt.service_layer_id, slnt.description AS service_layer_node_name, nnt.id, nnt.name, nnt.description
          FROM client.service_layer_node_type slnt
          JOIN client.network_node_types nnt ON nnt.id = slnt.network_node_type_id
          WHERE is_displayed=true
            AND show_in_boundaries=true
      `)
    })
    .then((nodeTypes) => {
      exports.serviceLayers.forEach((layer) => {
        layer.nodeTypes = nodeTypes.filter((type) => type.service_layer_id === layer.id)
      })
    })
}

function loadAnalysisLayers () {
  return database.query('SELECT * FROM client.analysis_layer ORDER BY id ASC')
    .then((response) => {
      exports.analysisLayers = response
    })
}

function loadConfiguration() {
  const configurationTypes = [
    'locationCategories',
    'networkEquipment',
    'constructionSiteCategories',
    'boundaryCategories',
    'units',
    'mapType',
    'locationDetailProperties',
    'perspectives',
    'optimizationOptions',
    'planEditor',
    'resourceEditors'
  ]

  var configurationPromises = []
  configurationTypes.forEach(configurationType => configurationPromises.push(UIConfiguration.getConfigurationSet(configurationType)))
  return Promise.all(configurationPromises)
    .then(results => {
      exports.configuration = {}
      configurationTypes.forEach((configurationType, index) => {
        exports.configuration[configurationType] = results[index]
      })
      exports.configuration.ARO_CLIENT = process.env.ARO_CLIENT
      return Promise.resolve()
    })
    .catch(err => console.error(err))
}

exports.clearUiConfigurationCache = () => UIConfiguration.clearCache()

exports.refresh = () => {
  return Promise.all([
    loadAnalysisLayers(),
    loadServiceLayers(),
    loadFiberTypes(),
    loadConfiguration()
  ])
    .then(() => console.log(`Cache loaded ${exports.serviceLayers.length} service areas, ${exports.analysisLayers.length} analysis layers`))
}

exports.refresh()
  .catch((err) => console.log('Error refreshing cache', err.stack))
