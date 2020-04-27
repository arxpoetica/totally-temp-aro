var models = require('../models')
exports.configure = (app, middleware) => {
  var check_admin = middleware.check_admin
  var jsonSuccess = middleware.jsonSuccess

  app.get('/etltemplate', check_admin, (request, response, next) => {
      models.UiEtlTemplate.getEtlTemplatesByType()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.get('/etltemplate/download/location', check_admin, (request, response, next) => {
    if(process.env.ARO_CLIENT === 'sse')
        response.download('public/csv/sse_location_upload_template.csv', 'template_locations.csv');
    else 
        response.download('public/csv/template_locations.zip');
  })

  app.get('/etltemplate/download/equipment', check_admin, (request, response, next) => {
    if(process.env.ARO_CLIENT === 'sse')
        response.download('public/csv/sse_equipment_upload_template.csv', 'template_locations.csv');
    else 
        response.download('public/csv/template_equipment.csv');
  })
  
  app.get('/etltemplate/download/fiber', check_admin, (request, response, next) => {
        response.download('public/csv/sample_fiber.zip');
  })

  app.get('/etltemplate/download/construction_location', check_admin, (request, response, next) => {
        response.download('public/csv/template_construction_locations.zip');
  })

  app.get('/etltemplate/download/service_layer', check_admin, (request, response, next) => {
        response.download('public/csv/sample_service_area.zip');
  })
  
  app.get('/etltemplate/download/tile_system', check_admin, (request, response, next) => {
        response.download('public/csv/example_upload_tile_system.csv');
  })

  app.get('/etltemplate/download/edge', check_admin, (request, response, next) => {
        response.download('public/csv/sample_edges.zip');
  })
}
