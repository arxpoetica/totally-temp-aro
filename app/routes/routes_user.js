var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/user/find', (request, response, next) => {
    var text = request.query.text
    models.User.find_by_text(text)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
