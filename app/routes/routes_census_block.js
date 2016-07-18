var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/census_blocks/:statefp/:countyfp', middleware.viewport, (request, response, next) => {
    var statefp = request.params.statefp
    var countyfp = request.params.countyfp
    var viewport = request.viewport
    models.CensusBlock.findByStatefpAndCountyfp(statefp, countyfp, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/census_blocks/:carrier', middleware.viewport, (request, response, next) => {
    var carrier = request.params.carrier
    var viewport = request.viewport
    models.CensusBlock.findByNbmCarrier(carrier, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
