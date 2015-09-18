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
  api.get('/market_size/:plan_id/calculate', function(request, response, next) {
    var plan_id = request.params.plan_id;
    var type = request.query.type;
    var options = {
     boundary: request.query.boundary,
     filters: {
       industry: request.query.industry,
       employees_range: request.query.employees_range,
       product: request.query.product,
     },
    }
    models.MarketSize.calculate(plan_id, type, options, jsonHandler(response, next));
  });

};
