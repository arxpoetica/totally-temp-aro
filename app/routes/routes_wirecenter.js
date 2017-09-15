var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/service_areas/:type', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var type = request.params.type
    models.Wirecenter.findServiceAreas(viewport, type)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/service_areas/:type/all', (request, response, next) => {
    var type = request.params.type
    models.Wirecenter.findServiceAreas(null, type)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/analysis_areas/:type', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var type = request.params.type
    models.Wirecenter.findAnalysisAreas(viewport, type)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Add Servicearea targets to a plan
  api.post('/service_areas/:planId/addServiceAreaTargets', (request, response, next) => {
    var planId = request.params.planId
    var serviceAreaIds = request.body.serviceAreaIds
    models.Wirecenter.addServiceAreaTargets(planId, serviceAreaIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Remove plan targets from a plan
  api.post('/service_areas/:planId/removeServiceAreaTargets', (request, response, next) => {
    var planId = request.params.planId
    var serviceAreaIds = request.body.serviceAreaIds
    models.Wirecenter.removeServiceAreaTargets(planId, serviceAreaIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Remove all plan targets from a plan
  api.delete('/service_areas/:planId/removeAllServiceAreaTargets', (request, response, next) => {
    var planId = request.params.planId
    models.Wirecenter.removeAllServiceAreaTargets(planId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Select all highlight service area targets from a plan
  api.get('/service_areas/:planId/selectedServiceAreaIds', (request, response, next) => {
    var planId = request.params.planId
    models.Wirecenter.selectedServiceAreaIds(planId)
    .then(jsonSuccess(response, next))
    .catch(next)
  })

}
