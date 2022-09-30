var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // FIXME: legacy code, transfer to service
  api.get('/census_blocks/:id/details', (request, response, next) => {
    var id = request.params.id
    models.CensusBlock.getCensusBlockDetails(id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

}
