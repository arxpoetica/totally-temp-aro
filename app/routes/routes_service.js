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

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // Get all requests (POST/GET/DELETE/PUT,etc) that start with /service, and then pass those
  // on to ARO-Service. Do NOT modify any data - this is intended to be a pass-through service
  const SERVICE_PREFIX = '/service'
  api.all(`${SERVICE_PREFIX}/*`, expressProxy(`${config.aro_service_url}`, {
    proxyReqPathResolver: req => {
      // First construct the full url (i.e. including the http(s)://<hostname>)
      const fullUrl = new URL(`${req.protocol}://${req.get('host')}${req.url}`)

      // Now extract the existing query parameters
      const searchParams = new URLSearchParams(fullUrl.searchParams)

      // Overwrite or add the user_id query parameter. (Overwrite so that authenticated clients cannot
      // impersonate other users). Then set the query parameters back to the original URL.
      searchParams.set('user_id', req.user.id)
      fullUrl.search = searchParams

      // Construct the "final" URL by removing the protocol, host, etc so it looks like '/v1/plan?user_id=xxx'
      const finalUrl = fullUrl.href.substring(fullUrl.href.indexOf('/service/') + '/service/'.length - 1)

      return finalUrl
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