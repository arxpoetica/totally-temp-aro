var models = require('../models')
var Busboy = require('busboy')
var path = require('path')
var os = require('os')
var fs = require('fs')

exports.configure = (api, middleware) => {
  var check_any_permission = middleware.check_any_permission
  var check_owner_permission = middleware.check_owner_permission
  var jsonSuccess = middleware.jsonSuccess

  api.get('/network/fiber_plant/:carrier_name', middleware.viewport, (request, response, next) => {
    var carrier_name = request.params.carrier_name
    var viewport = request.viewport
    models.Network.viewFiberPlantForCarrier(carrier_name, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/fiber_plant_competitors', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Network.viewFiberPlantForCompetitors(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/fiber_plant_density', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Network.viewFiberPlantDensity(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/fairshare_density', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.MarketSize.fairShareHeatmap(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/carriers/:plan_id', (request, response, next) => {
    var plan_id = request.params.plan_id
    var fiberType = request.query.fiberType || 'fiber'
    models.Network.carriers(plan_id, fiberType)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Network nodes for user client by node type
  api.get('/network/nodes/:node_type', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var node_type = request.params.node_type
    models.Network.viewNetworkNodes([node_type], null, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Network nodes of an existing route
  api.get('/network/nodes/:plan_id/find', check_any_permission, middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = request.params.plan_id
    var node_types = request.query.node_types && request.query.node_types.split(',')
    models.Network.viewNetworkNodes(node_types, plan_id, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Edit network nodes in a route
  api.post('/network/nodes/:plan_id/edit', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var changes = request.body
    models.Network.editNetworkNodes(plan_id, changes)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/network/nodes/:plan_id/csv', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var busboy = new Busboy({ headers: request.headers })
    var fullpath
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      fullpath = path.join(os.tmpDir(), String(Date.now()))
      file.pipe(fs.createWriteStream(fullpath))
    })
    busboy.on('finish', () => {
      models.Network.importLocations(plan_id, fullpath)
        .then(jsonSuccess(response, next))
        .catch(next)
    })
    request.pipe(busboy)
  })

  // Clear network nodes in a route
  api.post('/network/nodes/:plan_id/clear', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    models.Network.clearNetworkNodes(plan_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Recalculate network nodes
  api.post('/network/nodes/:plan_id/recalc', check_owner_permission, (request, response, next) => {
    var plan_id = +request.params.plan_id
    var options = request.body.options
    models.Network.recalculateNodes(plan_id, options)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Recalculate network nodes
  api.post('/network/nodes/:plan_id/select_boundary', check_owner_permission, (request, response, next) => {
    var plan_id = +request.params.plan_id
    var data = request.body
    models.Network.selectBoundary(plan_id, data)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Network node types
  api.get('/network/nodes', (request, response, next) => {
    models.Network.viewNetworkNodeTypes()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/search/boundaries', (request, response, next) => {
    var text = request.query.text
    models.Network.searchBoundaries(text)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
