var models = require('../models')
var _ = require('underscore')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/locations/:plan_id', middleware.viewport, (request, response, next) => {
    var type = request.query.type
    var viewport = request.viewport
    var plan_id = +request.params.plan_id

    var filters = {}
    var keys = ['industries', 'customer_types', 'number_of_employees']
    keys.forEach((key) => {
      filters[key] = _.compact((request.query[key] || '').split(',').map((v) => +v || null))
    })
    models.Location.findAll(plan_id, type, filters, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/locations/:plan_id/selected', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = +request.params.plan_id

    models.Location.findSelected(plan_id, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/locations/:plan_id/density', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = +request.params.plan_id
    models.Location.density(plan_id, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/locations/:location_id/show', (request, response, next) => {
    var location_id = request.params.location_id
    models.Location.showInformation(location_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/locations/businesses/:location_id', (request, response, next) => {
    var location_id = request.params.location_id
    models.Location.showBusinesses(location_id)
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

  api.get('/search', (request, response, next) => {
    var text = request.query.text
    models.Location.search(text)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
