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

  api.get('/cma_boundaries', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Wirecenter.findCMA(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
