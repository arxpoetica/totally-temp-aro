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

  app.post('/settings/update_settings', (request, response, next) => {
    var user = request.user
    var firstName = request.body.first_name
    var lastName = request.body.last_name
    var email = request.body.email

    var promise = Promise.resolve()
    var oldPassword = request.body.old_password
    var password = request.body.password
    var passwordConfirm = request.body.password_confirm

    if (oldPassword && password && passwordConfirm) {
      if (password !== passwordConfirm) {
        request.flash('error', 'Passwords do not match')
        return response.redirect('/settings/show')
      }

      promise = models.User.changePassword(user.id, oldPassword, password)
    }
    promise
      .then(() => (
        models.User.updateSettings(user.id, firstName, lastName, email)
      ))
      .then(() => {
        request.flash('success', 'Settings changed successfully')
        response.redirect('/settings/show')
      })
      .catch((err) => {
        request.flash('error', err.message)
        response.redirect('/settings/show')
      })
  })
}
