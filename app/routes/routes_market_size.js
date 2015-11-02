var models = require('../models');
var _ = require('underscore');
var nook = require('node-errors').nook;

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  // Market size filters
  api.get('/market_size/filters', function(request, response, next) {
    models.MarketSize.filters(jsonHandler(response, next));
  });

  // Market size calculation
  api.get('/market_size/:plan_id/calculate', function(request, response, next) {
    var plan_id = +request.params.plan_id;
    var type = request.query.type;
    var options = {
      boundary: request.query.boundary,
      filters: {
        industry: arr(request.query.industry),
        employees_range: arr(request.query.employees_range),
        product: arr(request.query.product),
      },
    };
    models.MarketSize.calculate(plan_id, type, options, jsonHandler(response, next));
  });

  // Export businesses involved in market size calculation
  api.get('/market_size/:plan_id/export', function(request, response, next) {
    var plan_id = +request.params.plan_id;
    var type = request.query.type;
    var options = {
      boundary: request.query.boundary,
      filters: {
        industry: arr(request.query.industry),
        employees_range: arr(request.query.employees_range),
        product: arr(request.query.product),
      },
    };
    var filename = request.query.filename;
    models.MarketSize.export_businesses(plan_id, type, options, request.user, nook(next, function(output) {
      response.attachment(filename+'.csv');
      response.send(output);
    }));
  });

  api.get('/market_size/business/:business_id', function(request, response, next) {
    var business_id = +request.params.business_id;
    models.MarketSize.market_size_for_business(business_id, jsonHandler(response, next));
  });

  function arr(value) {
    return _.compact((value || '').split(','));
  };

};
