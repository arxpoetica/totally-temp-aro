var models = require('../models');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  api.get('/user/find', function(request, response, next) {
    var text = request.query.text;
    models.User.find_by_text(text, jsonHandler(response, next));
  });

};
