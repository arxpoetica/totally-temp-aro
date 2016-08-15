var models = require('../models')

exports.configure = (app, middleware) => {
  var check_admin = middleware.check_admin
  var jsonSuccess = middleware.jsonSuccess

  app.get('/admin/settings', check_admin, (request, response, next) => {
    models.Settings.view()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/admin/settings', check_admin, (request, response, next) => {
    var options = request.body
    models.Settings.update(options)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
