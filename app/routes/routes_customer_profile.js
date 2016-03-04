var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/customer_profile/:plan_id/boundary', (request, response, next) => {
    var type = request.query.type
    var boundary = request.query.boundary
    models.CustomerProfile.customer_profile_for_boundary(type, boundary)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/customer_profile/all_cities', (request, response, next) => {
    models.CustomerProfile.customer_profile_all_cities()
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
