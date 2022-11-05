import User from '../models/user.js'

export const configure = (app, middleware) => {

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
        response.status(500)
        response.json({
          error: 'Passwords do not match'
        })
        return response
      }

      promise = User.changePassword(user.id, oldPassword, password)
    }
    promise
      .then(() => (
        User.updateSettings(user.id, firstName, lastName, email)
      ))
      .then(() => {
        response.json({
          success: 'Settings changed successfully'
        })
      })
      .catch((err) => {
        response.status(500)
        response.json({
          error: err.message
        })
      })
  })
}
