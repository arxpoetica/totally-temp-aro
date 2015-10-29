var models = require('../models');
var _ = require('underscore');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  api.get('/customer_profile/:plan_id/boundary', function(request, response, next) {
    var type = request.query.type;
    var boundary = request.query.boundary;
    models.CustomerProfile.customer_profile_for_boundary(type, boundary, jsonHandler(response, next));
  });

};
