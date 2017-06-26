var models = require('../models')
var helpers = require('../helpers')
var config = helpers.config

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/tile/:zoom/:x/:y/:layerId', (request, response, next) => {
    var zoom = request.params.zoom
    var x = request.params.x
    var y = request.params.y
    var layerId = request.params.layerId
    var aggregate = request.query.aggregate ? request.query.aggregate : false
    
    models.Tiles.getTileData(zoom, x, y, layerId, aggregate)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}