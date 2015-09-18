var models = require('../models');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  api.post('/permissions/:plan_id/grant', check_any_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    var user_id = request.body.user_id;
    models.Permission.grant_access(plan_id, user_id, 'guest', jsonHandler(response, next));
  });

};
