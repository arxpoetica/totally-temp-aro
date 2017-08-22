var models = require('../models')
var helpers = require('../helpers')
var config = helpers.config

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // Get all requests (POST/GET/DELETE/PUT,etc) that start with /service, and then pass those
  // on to ARO-Service. Do NOT modify any data - this is intended to be a pass-through service
  api.all('/service/*', (request, response, next) => {

    // Chop off the prefix on this requests URL, and we get the URL to pass to aro-service
    var serviceUrl = request.url.substring('/service/'.length)
    var req = {
      url: `${config.aro_service_url}/${serviceUrl}`,
      method: request.method,
      params: request.params
    }

    // Attach request body if required
    if (request.method !== 'GET') {
      req.body = request.body
    }

    models.AROService.request(req)
      .then((data) => Promise.resolve(JSON.parse(data)))  // "data" comes back as a string from aro-service. Convert it to a obj.
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}