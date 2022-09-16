const expressProxy = require('express-http-proxy')
const URL = require('url').URL
const URLSearchParams = require('url').URLSearchParams
var models = require('../models')
var helpers = require('../helpers')
var config = helpers.config
var fs = require('fs')
var multer = require('multer')
var os = require('os')
var upload = multer({ dest: os.tmpdir() })
const userIdInjector = require('./user-id-injector')

exports.configure = (api, middleware, ServerSocketManager) => {
  var jsonSuccess = middleware.jsonSuccess

  // Set up all our pass-through routes (e.g. urls starting with /service are routed to aro-service).
  // Set it up as a pure pass-through route - do not modify any data
  const passThroughs = {
    '/service': config.aro_service_url,
    '/map-reports': config.map_reports_url
  }
  Object.keys(passThroughs).forEach(prefixUrl => {
    api.all(`${prefixUrl}/*`, expressProxy(`${passThroughs[prefixUrl]}`, {
      proxyReqPathResolver: req => userIdInjector(req, prefixUrl, '', req.user.id),
      proxyErrorHandler: (err, res, next) => {
        if (err && err.code === 'ETIMEDOUT') {
          return res.status(504).send(`'ETIMEDOUT' became 504'`)
        }
        next(err)
      }
    }))
  })

  // For vector tile requests that return data via websockets, save the request uuid. Then pass the
  // request through to service
  const TILE_SOCKET_SERVICE_PREFIX = '/service-tile-sockets'
  api.post(`${TILE_SOCKET_SERVICE_PREFIX}/*`, expressProxy(`${config.aro_service_url}`, {
    proxyReqPathResolver: req => {
      // Remove /service-tile-sockets from the beginning of the url to get the final url
      return req.url.substring(TILE_SOCKET_SERVICE_PREFIX.length)
    },
    proxyReqBodyDecorator: (bodyContent, srcReq) => {
      // First construct the full url (i.e. including the http(s)://<hostname>)
      const fullUrl = new URL(`${srcReq.protocol}://${srcReq.get('host')}${srcReq.url}`)

      // Now extract the existing query parameters
      const searchParams = new URLSearchParams(fullUrl.searchParams)

      // Get the request_uuid query parameter
      const requestUuid = searchParams.get('request_uuid')
      if (!requestUuid) {
        return Promise.reject(new Error('You must specify a request_uuid query parameter for socket routing to work'))
      }

      // Get the websocketId body parameter
      const websocketSessionId = srcReq.body.websocketSessionId
      if (!websocketSessionId) {
        return Promise.reject(new Error('You must specify a websocketSessionId body parameter for socket routing to work'))
      }
      // ...i have questions about firing sockets from an endpoint...
      ServerSocketManager.mapVectorTileUuidToClientId(requestUuid, websocketSessionId)

      // For the request to service, we have to pass only the layerDefinitions
      return bodyContent.layerDefinitions
    }
  }))

  // Get all requests (POST/GET/DELETE/PUT,etc) that start with /uploadservice, and then pass those
  // on to ARO-Service. Do NOT modify any data - this is intended to be a pass-through service
  api.post('/uploadservice/*', upload.single('file'), uploadDataSourceFiles)

  function uploadDataSourceFiles (request, response, next) {

    // Chop off the prefix on this requests URL, and we get the URL to pass to aro-service
    var serviceUrl = request.url.substring('/uploadservice/'.length)
    var file = request.file && request.file.path
    var req = {
      method: 'POST',
      url: `${config.aro_service_url}/${serviceUrl}`,
      formData: {
        file: fs.createReadStream(file)
      }
    }

    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  }

  // For Reports, we have to send back the result as an attachment.
  api.all('/service-download-file/:fileName/*', (request, response, next) => {

    // Chop off the prefix on this requests URL, and we get the URL to pass to aro-service
    request.params.user_id = request.user.id
    var fileName = request.params.fileName || 'DefaultFileName'
    var serviceUrl = request.url.substring(`/service-download-file/${fileName}/`.length)
    var req = {
      url: `${config.aro_service_url}/${serviceUrl}`,
      method: request.method,
      params: request.params,
      encoding: null // IMPORTANT: We are getting binary data back from aro-service. Do not encode anything.
    }

    // Attach request body if required
    if (request.method !== 'GET') {
      req.body = JSON.stringify(request.body)
      req.headers = {
        'content-type': 'application/json;charset=UTF-8'
      }
    }
    return models.AROService.request(req)
      .then((output) => {
        response.attachment(fileName)
        response.send(output)
      })
      .catch(next)
  })
}
