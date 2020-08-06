var models = require('../models')
var helpers = require('../helpers')
var config = helpers.config

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/competitors/*', (request, response, next) => {

    // Implemented as a pass-through route to aro-service
    // Chop off the prefix on this requests URL, and we get the URL to pass to aro-service
    var apiUrl = request.url.substring('/competitors/'.length)

    var serviceRequest = {
      method: 'GET',
      url: `${config.aro_service_url}/${apiUrl}`
    }
    return models.AROService.request(serviceRequest)
      .then((output) => {
        response.send(JSON.parse(output)) // Not sure why "output" is coming back as a string
      })
      .catch(next)
  })
}