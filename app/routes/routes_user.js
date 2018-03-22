var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/user/find', (request, response, next) => {
    var text = request.query.text
    models.User.find_by_text(text)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.put('/user/default_location/:location', (request, response, next) => {
    var default_location = request.params.location
    var user_id = request.user.id
    models.User.setDefaultLocation(default_location,user_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
