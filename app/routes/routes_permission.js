var models = require('../models');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  api.post('/permissions/:route_id/grant', check_any_permission, function(request, response, next) {
    var route_id = request.params.route_id;
    var user_id = request.body.user_id;
    models.Permission.grant_access(route_id, user_id, 'guest', jsonHandler(response, next));
  });

};
