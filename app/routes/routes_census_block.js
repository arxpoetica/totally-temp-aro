var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/census_blocks/:statefp/:countyfp', middleware.viewport, (request, response, next) => {
    var statefp = request.params.statefp
    var countyfp = request.params.countyfp
    var viewport = request.viewport
    models.CensusBlock.find_by_statefp_and_countyfp(statefp, countyfp, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
