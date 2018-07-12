var models = require('../models')
var helpers = require('../helpers')
var config = helpers.config

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.post('/tile/*', (request, response, next) => {
    // Implemented as a pass-through route to aro-service
    // Chop off the prefix on this requests URL, and we get the URL to pass to aro-service
    var apiUrl = request.url.substring('/tile/'.length)
    models.Tiles.getTileData(apiUrl, request.body)
      .then((binaryData) => {
        // Send the binary data as-is to the client
        response.write(binaryData, 'binary')
        response.end(null, 'binary')
      })
      .catch(next)

  })
}