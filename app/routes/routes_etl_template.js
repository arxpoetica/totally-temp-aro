const models = require('../models')
const multer = require('multer')
const os = require('os')
const upload = multer({ dest: os.tmpDir() })
const fs = require('fs')

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

  // Remove all plan targets from a plan
  app.delete('/etltemplate/:templateId', check_admin, (request, response, next) => {
    var templateId = request.params.templateId
    models.UiEtlTemplate.deleteEtlTemplate(templateId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Save a binary UI asset into the database
  app.post('/etltemplate/:dataType', upload.single('file'), (request, response, next) => {
    const dataType = request.params.dataType
    const data = fs.readFileSync(request.file.path)
    let mediaType = 3
    if(request.file.mimetype === "text/csv")
      mediaType = 1
    const fileNameWithoutExtension = request.file.originalname.replace(/\.[^/.]+$/, "")
    models.UiEtlTemplate.addEtlTemplate(dataType, fileNameWithoutExtension, fileNameWithoutExtension, mediaType, data)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
