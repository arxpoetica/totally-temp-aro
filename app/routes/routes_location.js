var helpers = require('../helpers')
var config = helpers.config
var models = require('../models')
var multer = require('multer')
var os = require('os')
var upload = multer({ dest: os.tmpDir() })

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess
  var check_any_permission = middleware.check_any_permission
  var check_owner_permission = middleware.check_owner_permission

  api.get('/locations/:plan_id', check_any_permission, middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = +request.params.plan_id

    var filters = {}
    var keys = ['business_categories', 'household_categories', 'towers', 'dataSources']
    keys.forEach((key) => {
      var value = request.query[key] || []
      if (!Array.isArray(value)) {
        value = [value]
      }
      filters[key] = value
    })
    models.Location.findLocations(plan_id, filters, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
  
  api.post('/locations/visible/:plan_id', (request, response, next) => {
    var filters = {}
    filters['uploaded_datasources'] = request.body.uploaded_datasources || []
    var plan_id = +request.params.plan_id
    models.Location.findVisibleLocations(plan_id,filters)
    .then(jsonSuccess(response, next))
    .catch(next)
  })

  api.get('/locations/:plan_id/selected', check_any_permission, middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = +request.params.plan_id

    models.Location.findSelected(plan_id, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/locations/:plan_id/:location_id/show', check_any_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var location_id = request.params.location_id
    models.Location.showInformation(plan_id, location_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/locations/businesses/:location_id', (request, response, next) => {
    var location_id = request.params.location_id
    models.Location.showBusinesses(location_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/locations/towers/:location_id', (request, response, next) => {
    var location_id = request.params.location_id
    models.Location.showTowers(location_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/locations/create', (request, response, next) => {
    var data = request.body
    models.Location.createLocation(data)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/industries', (request, response, next) => {
    models.Location.findIndustries()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/customer_types', (request, response, next) => {
    models.Location.customerTypes()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/locations/:location_id/update', (request, response, next) => {
    var location_id = request.params.location_id
    var values = {
      number_of_households: request.body.number_of_households
    }
    models.Location.updateHouseholds(location_id, values)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/locations_filters', (request, response, next) => {
    models.Location.filters()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/locations_customer_profile_density', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Location.customerProfileHeatmap(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/search/locations', (request, response, next) => {
    var text = request.query.text
    models.Location.search(text)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/locations/:plan_id/targets', check_any_permission, (request, response, next) => {
    var planId = +request.params.plan_id
    models.Location.findTargets(planId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/locations/:plan_id/targets/delete', check_owner_permission, (request, response, next) => {
    var planId = +request.params.plan_id
    var locationId = +request.body.locationId
    models.Location.deleteTarget(planId, locationId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/locations/:plan_id/targets/delete_all', check_owner_permission, (request, response, next) => {
    var planId = +request.params.plan_id
    models.Location.deleteAllTargets(planId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  function editUserDefinedCustomers (request, response, next) {
    var name = request.body.name
    var id = request.params.id || null
    var user = request.user
    var fullpath = request.file && request.file.path
    models.Location.editUserDefinedCustomers(user, id, name, fullpath)
      .then(jsonSuccess(response, next))
      .catch(next)
  }

  // Create a user-defined customers
  api.post('/locations/user_defined', upload.single('file'), editUserDefinedCustomers)

  // Edit a user-defined customers
  api.post('/locations/user_defined/:id', upload.single('file'), editUserDefinedCustomers)

  api.get('/datasources', (request, response, next) => {
    var userId = request.user.id
    var req = {
      method: 'GET',
      url: config.aro_service_url + `/user-entites/user/${userId}`,
      json: true
    }
    return models.AROService.request(req)
      .then((output) => console.log('', output) || response.send(output))
      .catch(next)
  })

  api.get('/towers/:dataSourceId', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var dataSourceId = request.params.dataSourceId

    models.Location.towersByDataSource(dataSourceId, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  function saveMorphology (request, response, next) {
    var name = request.body.name
    var id = request.params.id || null
    var user = request.user
    var fullpath = request.file && request.file.path
    models.Location.saveMorphology(user, id, name, fullpath)
      .then(jsonSuccess(response, next))
      .catch(next)
  }

  // Create a user-defined customers
  api.post('/locations/morphology', upload.single('file'), saveMorphology)
}
