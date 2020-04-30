var models = require('../models')
var fs = require('fs')

exports.configure = (app, middleware) => {
  var check_admin = middleware.check_admin
  var jsonSuccess = middleware.jsonSuccess

  app.get('/etltemplate', check_admin, (request, response, next) => {
      const dataType = request.query.datatype || 1
      models.UiEtlTemplate.getEtlTemplateNamesByType(dataType)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.get('/etltemplate/download', check_admin, (request, response, next) => {
      const templateId = request.query.id
      models.UiEtlTemplate.getEtlTemplateFileText(templateId)
      .then( output => {
            response.setHeader('Content-type', "application/octet-stream")
            response.setHeader('Content-disposition', 'attachment; filename=' + output.name + '.' + output.type)
            response.send(output.template)
      })
      .catch(next)
      
    })
}
