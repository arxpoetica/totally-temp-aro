var models = require('../models')

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
    models.Network.carriers(plan_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/towers', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Network.viewTowers(viewport)
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
    var algorithm = request.body.algorithm
    // models.NetworkPlan.recalculate_route(plan_id, algorithm)
    models.Network.recalculateNodes(plan_id, algorithm)
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
}
