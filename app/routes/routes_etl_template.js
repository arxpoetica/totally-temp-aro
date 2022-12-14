const models = require('../models')
const multer = require('multer')
const os = require('os')
const upload = multer({ dest: os.tmpdir() })
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

  // Save a text template into the database
  app.post('/etltemplate/:dataType', upload.single('file'), (request, response, next) => {
    const dataType = request.params.dataType
    const data = fs.readFileSync(request.file.path)
    const ext = request.file.originalname.split('.').pop()
    let mediaType = 3 // report.media_type kml file 
    if(ext === "csv")
      mediaType = 1
    else if(ext === "kml")
      mediaType = 3
    else {
      console.log("Invalid template type. Template file has to be type of csv or kml.")
      return
    }

    const fileNameWithoutExtension = request.file.originalname.replace(/\.[^/.]+$/, "")
    models.UiEtlTemplate.addEtlTemplate(dataType, fileNameWithoutExtension, fileNameWithoutExtension, mediaType, data)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
