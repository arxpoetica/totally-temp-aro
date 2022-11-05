import Settings from '../models/settings.js'
import cache from '../helpers/cache.cjs'

export const configure = (app, middleware) => {
  var check_admin = middleware.check_admin
  var jsonSuccess = middleware.jsonSuccess

  app.get('/admin/settings', check_admin, (request, response, next) => {
    Settings.view()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/admin/settings', check_admin, (request, response, next) => {
    var options = request.body
    Settings.update(options)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/admin/settings/refresh_cache', check_admin, (request, response, next) => {
    cache.refresh()
      .then(() => response.redirect('/'))
      .catch(next)
  })

  app.post('/admin/settings/refresh_db_cache', check_admin, (request, response, next) => {
    Settings.refreshDBCache();
    cache.refresh()
      .then(() => response.redirect('/'))
      .catch(next)
  })  
}
