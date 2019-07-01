const expressProxy = require('express-http-proxy')
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
      // Chop off '/service' from the URL
      var serviceUrl = req.url.substring('/service/'.length - 1)
      // Append the logged in users id to all service calls. This will replace the user id even if the
      // client has specified it. This is to prevent authenticated clients impersonating other users.
      req.query.user_id = req.user.id
      return serviceUrl
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
    var fileName = request.params.fileName || 'DefaultFileName'
    var serviceUrl = request.url.substring(`/service-download-file/${fileName}/`.length)
    var req = {
      url: `${config.aro_service_url}/${serviceUrl}`,
      method: request.method,
      encoding: null    // IMPORTANT: We are getting binary data back from aro-service. Do not encode anything.
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