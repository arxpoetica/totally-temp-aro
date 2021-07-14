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

// service_layer_node_type no longer exists, depricate this
function loadServiceLayers () {
  return database.query('SELECT * FROM client.service_layer WHERE is_user_defined=false AND show_in_boundaries=true ORDER BY id ASC')
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
    'copperCategories',
    'constructionSiteCategories',
    'boundaryCategories',
    'units',
    'mapType',
    'locationDetailProperties',
    'perspectives',
    'plan',
    'planEditor',
    'toolbar',
    'optimizationOptions',
    'resourceEditors',
    'showPlanDataSelection',
    'broadcast',
    'userGroupsWarning',
  ]

  const configTypeToSubtype = {
    'networkEquipment': [
      'equipments'
    ]
  }

  // ToDo: not a fan of this, front end shouldn't be accessing the DB directly, should always use the API
  // get /odata/NetworkNodeSubtypeEntity
  const sql = `SELECT client.network_node_subtype.*, client.network_node_types.name network_node_type 
    FROM client.network_node_subtype
    LEFT JOIN client.network_node_types ON client.network_node_subtype.node_type_id = client.network_node_types.id`
  database.query(sql)
    .then((response) => {
      var subtypesByType = {}
      response.forEach(subtype => {
        if (!subtypesByType.hasOwnProperty(subtype.network_node_type)) {
          subtypesByType[subtype.network_node_type] = []
        }
        subtypesByType[subtype.network_node_type].push(subtype)
      })

      var configurationPromises = []
      configurationTypes.forEach(configurationType => configurationPromises.push(UIConfiguration.getConfigurationSet(configurationType)))
      return Promise.all(configurationPromises)
        .then(results => {
          exports.configuration = {}
          configurationTypes.forEach((configurationType, index) => {
            exports.configuration[configurationType] = results[index]
            
            // attach subtype data to types that have them
            if (configTypeToSubtype.hasOwnProperty(configurationType)) {
              configTypeToSubtype[configurationType].forEach(subtypeParent => {
                if (exports.configuration[configurationType].hasOwnProperty(subtypeParent)) {
                  Object.keys(subtypesByType).forEach(nodeType => {
                    if (exports.configuration[configurationType][subtypeParent].hasOwnProperty(nodeType)) {
                      exports.configuration[configurationType][subtypeParent][nodeType].subtypeLayers = subtypesByType[nodeType]
                    }
                  })
                }
              })
            }
          })
          exports.configuration.ARO_CLIENT = process.env.ARO_CLIENT
          return Promise.resolve()
        })
    })
    .catch(err => console.error(err))
}

function loadEnumStrings () {
  UIConfiguration.getEnumStrings()
    .then(result => { exports.enumStrings = result })
    .catch(err => console.error(err))
}

exports.clearUiConfigurationCache = () => UIConfiguration.clearCache()

exports.refresh = () => {
  return Promise.all([
    loadAnalysisLayers(),
    loadServiceLayers(),
    loadFiberTypes(),
    loadConfiguration(),
    loadEnumStrings()
  ])
    .then(() => console.log(`Cache loaded ${exports.serviceLayers.length} service areas, ${exports.analysisLayers.length} analysis layers`))
}

exports.refresh()
  .catch((err) => console.log('Error refreshing cache', err.stack))
