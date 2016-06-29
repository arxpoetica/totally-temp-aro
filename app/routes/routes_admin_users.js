var models = require('../models')

exports.configure = (app, middleware) => {
  var check_admin = middleware.check_admin
  var jsonSuccess = middleware.jsonSuccess

  app.get('/admin/users', check_admin, (request, response, next) => {
    models.User.find()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/admin/users/register', check_admin, (request, response, next) => {
    var options = request.body
    models.User.register(options)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/admin/users/delete', check_admin, (request, response, next) => {
    var user_id = request.body.user
    models.User.deleteUser(user_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/admin/users/resend', check_admin, (request, response, next) => {
    var user_id = request.body.user
    models.User.resendLink(user_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
