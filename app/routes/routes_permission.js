var models = require('../models')

exports.configure = (api, middleware) => {
  var check_any_permission = middleware.check_any_permission
  var jsonSuccess = middleware.jsonSuccess

  api.post('/permissions/:plan_id/grant', check_any_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var user_id = request.body.user_id
    models.Permission.grantAccess(plan_id, user_id, 'guest')
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
