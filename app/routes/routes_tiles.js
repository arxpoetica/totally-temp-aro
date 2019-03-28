const models = require('../models')
const socketManager = require('../sockets/socketManager').socketManager

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // Use this route when you want to get the tile data back in the response.
  api.post('/tile/*', (request, response, next) => {
    // Implemented as a pass-through route to aro-service
    // Chop off the prefix on this requests URL, and we get the URL to pass to aro-service
    var apiUrl = request.url.substring('/tile/'.length)

    models.Tiles.getTileData(apiUrl, request.body)
      .then((binaryData) => {
        // Send the binary data as-is to the client
        response.write(binaryData, 'binary')
        response.end(null, 'binary')
      })
      .catch(next)
  })

  // Use this route when you want to get the tile data back via a websocket.
  api.post('/tile-sockets/*', (request, response, next) => {
    // Implemented as a pass-through route to aro-service
    // Chop off the prefix on this requests URL, and we get the URL to pass to aro-service
    var apiUrl = request.url.substring('/tile-sockets/'.length)

    // Get the request UUID and save it in the Socket Manager so that it will know how to send the request back.
    const uuid = request.query.request_uuid
    if (!uuid) {
      return next(new Error('You must specify a request_uuid query parameter for socket routing to work'))
    }
    const websocketSessionId = request.body.websocketSessionId
    if (!websocketSessionId) {
      return next(new Error('You must specify a websocketSessionId body parameter for socket routing to work'))
    }
    socketManager().mapVectorTileUuidToRoom(uuid, websocketSessionId)

    models.Tiles.getTileData(apiUrl, request.body.layerDefinitions)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}