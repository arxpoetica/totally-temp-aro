var models = require('../models');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  // Market size filters
  api.get('/market_size/filters', function(request, response, next) {
    models.MarketSize.filters(jsonHandler(response, next));
  });

  // Market size filters
  api.get('/market_size/calculate', function(request, response, next) {
    var geo_json = request.query.geo_json;
    var threshold = request.query.threshold;
    var filters = {
      industry: request.query.industry,
      employees_range: request.query.employees_range,
      product: request.query.product,
    }
    models.MarketSize.calculate(geo_json, threshold, filters, jsonHandler(response, next));
  });

};
