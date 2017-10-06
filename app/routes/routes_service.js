var models = require('../models')
var helpers = require('../helpers')
var config = helpers.config
var fs = require('fs')
var multer = require('multer')
var os = require('os')
var upload = multer({ dest: os.tmpDir() })

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // Get all requests (POST/GET/DELETE/PUT,etc) that start with /service, and then pass those
  // on to ARO-Service. Do NOT modify any data - this is intended to be a pass-through service
  api.all('/service/*', (request, response, next) => {

    // Chop off the prefix on this requests URL, and we get the URL to pass to aro-service
    var serviceUrl = request.url.substring('/service/'.length)
    var req = {
      url: `${config.aro_service_url}/${serviceUrl}`,
      method: request.method,
      params: request.params,
      json: true
    }

    // Attach request body if required
    if (request.method !== 'GET') {
      req.body = request.body
    }

    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Get all requests (POST/GET/DELETE/PUT,etc) that start with /service, and then pass those
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
  
}