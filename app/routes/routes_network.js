var models = require('../models')
var helpers = require('../helpers')
var config = helpers.config

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // FIXME: legacy code, transfer to service
  api.get('/optimization/processes', (request, response, next) => {
    var req = {
      url: config.aro_service_url + '/optimization/processes',
      json: true
    }
    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

}
