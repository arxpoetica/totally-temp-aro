const kleur = require('kleur')

exports.configure = (api, middleware, ServerSocketManager) => {
  var jsonSuccess = middleware.jsonSuccess

  // FIXME: WHY ON EARTH ARE WE USING REST FOR SOCKETS?????

  api.post('/socket/broadcast', (request, response, next) => {
    console.log(kleur.bgGreen().black('LOGGING:'))
    console.log('app routes_socket.js /socket/broadcast', { req_body: request.body })

    const message = request.body
    ServerSocketManager.broadcastMessage(message)
    jsonSuccess(response, next)
  })
}
