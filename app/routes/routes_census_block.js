var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/census_blocks/:id/info', (request, response, next) => {
    var id = request.params.id
    models.CensusBlock.findCarriers(id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/census_blocks/:id/details', (request, response, next) => {
    var id = request.params.id
    models.CensusBlock.getCensusBlockDetails(id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/census_blocks/:statefp/:countyfp', middleware.viewport, (request, response, next) => {
    var statefp = request.params.statefp
    var countyfp = request.params.countyfp
    var viewport = request.viewport
    models.CensusBlock.findByStatefpAndCountyfp(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/census_blocks/all', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.CensusBlock.findAllNbmCarriers(viewport)
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
