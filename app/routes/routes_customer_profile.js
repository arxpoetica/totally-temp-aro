var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/customer_profile/:plan_id/boundary', (request, response, next) => {
    var type = request.query.type
    var boundary = request.query.boundary
    models.CustomerProfile.customerProfileForBoundary(type, boundary)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/customer_profile/all_cities', (request, response, next) => {
    models.CustomerProfile.customerProfileAllCities()
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
