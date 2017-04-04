var models = require('../models')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/uiConfiguration/:configSet', (request, response, next) => {
    var configSet = request.params.configSet
    var result = models.UIConfiguration.getConfigurationSet(configSet)
    response.status(200).json(result)
  })
}