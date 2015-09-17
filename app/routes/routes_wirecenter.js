var models = require('../models');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  api.get('/wirecenters/:wirecenter_code', function(request, response, next) {
    var wirecenter_code = request.params.wirecenter_code;
    models.Wirecenter.find_by_wirecenter_code(wirecenter_code, jsonHandler(response, next));
  });

};
