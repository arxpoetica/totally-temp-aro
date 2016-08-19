var models = require('../models')
var helpers = require('../helpers')
var public_config = helpers.public_config

exports.configure = (app, middleware) => {
  app.get('/settings/show', (request, response, next) => {
    response.render('settings.html', {
      user: request.user,
      error: request.flash('error'),
      success: request.flash('success'),
      config: public_config
    })
  })

  app.post('/settings/change_password', (request, response, next) => {
    var user = request.user
    var old_password = request.body.old_password
    var password = request.body.password
    var password_confirm = request.body.password_confirm

    if (password !== password_confirm) {
      request.flash('error', 'Passwords do not match')
      return response.redirect('/settings/show')
    }

    models.User.changePassword(user.id, old_password, password)
      .then(() => {
        request.flash('success', 'Password changed successfully')
        response.redirect('/settings/show')
      })
      .catch((err) => {
        request.flash('error', err.message)
        response.redirect('/settings/show')
      })
  })
}
