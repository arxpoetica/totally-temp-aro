var models = require('../models')

exports.configure = (api, middleware) => {
  var check_any_permission = middleware.check_any_permission
  var check_owner_permission = middleware.check_owner_permission
  var jsonSuccess = middleware.jsonSuccess

  // Find all created routes
  api.get('/network_plan/find_all', (request, response, next) => {
    var options = {
      page: +request.query.page,
      text: request.query.text,
      sortField: request.query.sortField,
      sortOrder: request.query.sortOrder,
      minimumCost: +request.query.minimumCost,
      maximumCost: +request.query.maximumCost,
      allPlans: request.query.allPlans === 'true'
    }
    models.NetworkPlan.findAll(request.user, options)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Create a new empty route
  api.post('/network_plan/create', (request, response, next) => {
    var name = request.body.name
    var area = request.body.area
    models.NetworkPlan.createPlan(name, area, request.user)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Create a new plan by copying an existing one
  api.post('/network_plan/:plan_id/copy', (request, response, next) => {
    var plan_id = request.params.plan_id
    var name = request.body.name
    models.NetworkPlan.copyPlan(plan_id, name, request.user)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Return data of an existing plan
  api.get('/network_plan/:plan_id', check_any_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    models.NetworkPlan.findPlan(plan_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Return the metadata of an existing plan
  api.get('/network_plan/:plan_id/metadata', check_any_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    models.NetworkPlan.findPlan(plan_id, true)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Clears the geography selection for an existing network plan
  api.post('/network_plan/:plan_id/clearGeographySelection', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    models.NetworkPlan.clearGeographySelection(plan_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Adds the specified geographies to an existing network plan
  api.post('/network_plan/:plan_id/addGeographies', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var geographies = request.body.geographies
    models.NetworkPlan.addGeographiesToPlan(plan_id, geographies)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Edits the route of an existing network plan
  api.post('/network_plan/:plan_id/edit', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var changes = request.body
    models.NetworkPlan.editRoute(plan_id, changes)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Edits basic information of an existing plan
  api.post('/network_plan/:plan_id/save', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var changes = request.body
    models.NetworkPlan.savePlan(plan_id, changes)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Delete an existing plan
  api.post('/network_plan/:plan_id/delete', check_owner_permission, (request, response, next) => {
    var userId = request.body.userId
    var plan_id = request.params.plan_id
    models.NetworkPlan.deletePlan(userId, plan_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Clear the route of an existing plan
  api.post('/network_plan/:plan_id/clear', check_owner_permission, (request, response, next) => {
    var userId = request.body.userId
    var plan_id = request.params.plan_id
    models.NetworkPlan.clearRoute(userId, plan_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Get some area information of a given plan
  api.get('/network_plan/:plan_id/area_data', check_any_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    models.NetworkPlan.calculateAreaData(plan_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Export a route as KML
  api.get('/network_plan/:plan_id/:file_name/export', check_any_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var file_name = request.params.file_name

    models.NetworkPlan.exportKml(plan_id)
      .then((kml_output) => {
        response.attachment(file_name + '.kml')
        response.send(kml_output)
      })
      .catch(next)
  })

  api.get('/search/businesses', (request, response, next) => {
    var text = request.query.text
    models.NetworkPlan.searchBusinesses(text)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/search/addresses', (request, response, next) => {
    const sessionToken = request.query.sessionToken
    if (!sessionToken) {
      Promise.reject('ERROR: You must specify a session token when performing an address search')
        .catch(next)
    } else {
      const text = request.query.text
      const biasLatitude = request.query.biasLatitude   // Optional
      const biasLongitude = request.query.biasLongitude // Optional
      models.NetworkPlan.searchAddresses(text, sessionToken, biasLatitude, biasLongitude)
        .then(jsonSuccess(response, next))
        .catch(next)
    }
  })

  api.get('/network_plan/:plan_id/child_plans', check_any_permission, middleware.viewport, (request, response, next) => {
    var plan_id = request.params.plan_id
    var viewport = request.viewport
    models.NetworkPlan.findChildPlans(plan_id, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Return data of an existing wirecenter plan
  api.get('/network_plan/:plan_id/:wirecenter_id', check_any_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var wirecenter_id = request.params.wirecenter_id
    models.NetworkPlan.findWirecenterPlan(plan_id, wirecenter_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Add plan targets to a plan
  api.post('/network_plan/:planId/addTargets', (request, response, next) => {
    var planId = request.params.planId
    var locationIds = request.body.locationIds
    models.NetworkPlan.addTargets(planId, locationIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Remove plan targets from a plan
  api.post('/network_plan/:planId/removeTargets', (request, response, next) => {
    var planId = request.params.planId
    var locationIds = request.body.locationIds
    models.NetworkPlan.removeTargets(planId, locationIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Remove all plan targets from a plan
  api.delete('/network_plan/:planId/removeAllTargets', (request, response, next) => {
    var planId = request.params.planId
    models.NetworkPlan.removeAllTargets(planId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Get addresses for the specified locations
  api.post('/network_plan/targets/addresses', (request, response, next) => {
    var locationIds = request.body.locationIds
    models.NetworkPlan.getTargetsAddresses(locationIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })//aro.location_entity

  // Get addresses for the specified service areas
  api.post('/network_plan/service_area/addresses', (request, response, next) => {
    var serviceAreaIds = request.body.serviceAreaIds
    models.NetworkPlan.getServiceAreaAddresses(serviceAreaIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Get addresses for the specified analysis areas
  api.post('/network_plan/analysis_area/addresses', (request, response, next) => {
    var analysisAreaIds = request.body.analysisAreaIds
    models.NetworkPlan.getAnalysisAreaAddresses(analysisAreaIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
