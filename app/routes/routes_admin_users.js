var models = require('../models')

exports.configure = (app, middleware) => {
  var check_admin = middleware.check_admin
  var jsonSuccess = middleware.jsonSuccess

  app.get('/admin/users', check_admin, (request, response, next) => {
    models.User.find()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/admin/users/hashPassword', check_admin, (request, response, next) => {
    models.User.hashPassword(request.body.password)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.get('/admin/users/count', (request, response, next) => {
    models.User.getUsersCount()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/admin/users/registerWithoutPassword', check_admin, (request, response, next) => {
    var options = request.body
    models.User.registerWithoutPassword(options)
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

  app.get('/admin/users/csv', check_admin, (request, response, next) => {
    models.User.downloadCSV()
      .then((output) => {
        response.attachment('users.csv')
        response.send(output)
      })
      .catch(next)
  })

  app.post('/admin/users/mail', check_admin, (request, response, next) => {
    var subject = request.body.subject
    var text = request.body.text
    models.User.sendMail(subject, text)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
