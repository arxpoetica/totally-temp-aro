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
      params: request.params,
      json: true
    }

    // Attach request body if required
    if (request.method !== 'GET') {
      req.body = request.body
    }

    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // For Reports, we have to send back the result as an attachment.
  api.get('/service-reports/:fileName/*', (request, response, next) => {

    // Chop off the prefix on this requests URL, and we get the URL to pass to aro-service
    var fileName = request.params.fileName || 'UnknownFilename.csv'
    var serviceUrl = request.url.substring(`/service-reports/${fileName}/`.length)
    var req = {
      url: `${config.aro_service_url}/${serviceUrl}`,
      method: request.method
    }

    return models.AROService.request(req)
      .then((output) => {
        response.attachment(fileName)
        response.send(output)
      })
      .catch(next)
  })
}