var models = require('../models')
var Busboy = require('busboy')
var path = require('path')
var os = require('os')
var fs = require('fs')

exports.configure = (api, middleware) => {
  var check_any_permission = middleware.check_any_permission
  var check_owner_permission = middleware.check_owner_permission
  var jsonSuccess = middleware.jsonSuccess

  api.get('/network/fiber_type/:plan_id/:type', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = request.params.plan_id
    var type = request.params.type
    models.Network.viewFiberByConstructionType(plan_id, type, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/fiber_plant/current_carrier', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Network.viewFiberPlantForCurrentCarrier(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

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

  api.get('/network/carriers/:plan_id/viewport', middleware.viewport, (request, response, next) => {
    var plan_id = request.params.plan_id
    var viewport = request.viewport
    var fiberType = request.query.fiberType || 'fiber'
    models.Network.carriers(plan_id, fiberType, viewport)
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

  api.get('/network/nodes/:plan_id/find', check_any_permission, middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = request.params.plan_id
    var node_types = request.query.node_types && request.query.node_types.split(',')
    models.Network.viewNetworkNodes(node_types, plan_id, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/nodes/:plan_id/find/:serviceLayer', check_any_permission, middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = request.params.plan_id
    var serviceLayer = request.params.serviceLayer
    var node_types = request.query.node_types && request.query.node_types.split(',')
    models.Network.viewNetworkNodes(node_types, plan_id, viewport, serviceLayer)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/fiber/:plan_id/find/:serviceLayer', check_any_permission, middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = request.params.plan_id
    var serviceLayer = request.params.serviceLayer
    models.Network.viewFiber(plan_id, serviceLayer, viewport)
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
      models.Network.importLocationsByCoordinates(plan_id, fullpath)
        .then(jsonSuccess(response, next))
        .catch(next)
    })
    request.pipe(busboy)
  })

  api.post('/network/nodes/:plan_id/csvIds', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var busboy = new Busboy({ headers: request.headers })
    var fullpath
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      fullpath = path.join(os.tmpDir(), String(Date.now()))
      file.pipe(fs.createWriteStream(fullpath))
    })
    busboy.on('finish', () => {
      models.Network.importLocationsByIds(plan_id, fullpath)
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

  api.get('/search/boundaries', middleware.viewport, (request, response, next) => {
    var text = request.query.text
    var viewport = request.viewport
    var types = request.query.types
    types = (Array.isArray(types) ? types : [types]).filter(Boolean)
    models.Network.searchBoundaries(text, types, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/road_segments', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Network.roadSegments(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/backhaul/:plan_id/links', (request, response, next) => {
    var plan_id = +request.params.plan_id
    models.Network.backhaulLinks(plan_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/backhaul/:plan_id/links', check_owner_permission, (request, response, next) => {
    var plan_id = +request.params.plan_id
    var fromIds = request.body.from_ids
    var toIds = request.body.to_ids
    models.Network.saveBackhaulLinks(plan_id, fromIds, toIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/data_sources/list', (request, response, next) => {
    var userId = request.user.id
    models.Network.dataSources(userId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/data_sources/delete', (request, response, next) => {
    var userId = request.user.id
    var dataSourceId = request.body.dataSource
    models.Network.deleteDataSource(userId, dataSourceId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
