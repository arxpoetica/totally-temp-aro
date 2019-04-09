const socketManager = require('../sockets/socketManager').socketManager

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.post('/socket/broadcast', (request, response, next) => {
    var message = request.body
    socketManager().broadcastMessage(message)
    Promise.resolve()
    .then(jsonSuccess(response, next))
    .catch(next)
  })
}
