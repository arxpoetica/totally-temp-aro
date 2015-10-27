var models = require('../models');
var _ = require('underscore');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  api.get('/locations/:plan_id', middleware.viewport, function(request, response, next) {
    var type = request.query.type;
    var viewport = request.viewport;
    var plan_id = +request.params.plan_id;

    var filters = {};
    ['industries', 'customer_types', 'number_of_employees'].forEach(function(key) {
      filters[key] = _.compact((request.query[key] || '').split(',').map(function(v) {
        return +v || null;
      }))
    });
    models.Location.find_all(plan_id, type, filters, viewport, jsonHandler(response, next));
  });

  api.get('/locations/:plan_id/density', middleware.viewport, function(request, response, next) {
    var viewport = request.viewport;
    var plan_id = +request.params.plan_id;
    models.Location.density(plan_id, viewport, jsonHandler(response, next));
  });

  api.get('/locations/:location_id/show', function(request, response, next) {
    var location_id = request.params.location_id;
    models.Location.show_information(location_id, jsonHandler(response, next));
  });

  api.get('/locations/businesses/:location_id', function(request, response, next) {
    var location_id = request.params.location_id;
    models.Location.show_businesses(location_id, jsonHandler(response, next));
  });

  api.post('/locations/create', function(request, response, next) {
    var location_id = request.params.location_id;
    var data = request.body;
    models.Location.create_location(data, jsonHandler(response, next));
  });

  api.get('/industries', function(request, response, next) {
    models.Location.find_industries(jsonHandler(response, next));
  });

  api.get('/customer_types', function(request, response, next) {
    models.Location.customer_types(jsonHandler(response, next));
  });

  api.post('/locations/:location_id/update', function(request, response, next) {
    var location_id = request.params.location_id;
    var values = {
      number_of_households: request.body.number_of_households,
    }
    models.Location.update_households(location_id, values, jsonHandler(response, next));
  });

  api.get('/locations_filters', function(request, response, next) {
    models.Location.filters(jsonHandler(response, next));
  });

};
