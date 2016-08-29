var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/wirecenters', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Wirecenter.findAll(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/cma_boundaries', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Wirecenter.findAllCMA(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/directional_facilities', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Wirecenter.findAllDirectionalFacilities(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
