var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/wirecenters/:wirecenter_code', (request, response, next) => {
    var wirecenter_code = request.params.wirecenter_code
    models.Wirecenter.findByWirecenterCode(wirecenter_code)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/wirecenters', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Wirecenter.findAll(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
