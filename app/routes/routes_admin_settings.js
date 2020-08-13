var models = require('../models')
var helpers = require('../helpers')
var cache = helpers.cache

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

  app.post('/admin/settings/refresh_cache', check_admin, (request, response, next) => {
    cache.refresh()
      .then(() => response.redirect('/'))
      .catch(next)
  })

  app.post('/admin/settings/refresh_db_cache', check_admin, (request, response, next) => {
    models.Settings.refreshDBCache();
    cache.refresh()
      .then(() => response.redirect('/'))
      .catch(next)
  })  
}
