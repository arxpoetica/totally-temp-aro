var models = require('../models');
var nook = require('node-errors').nook;

exports.configure = function(app, middleware) {

  var check_admin = middleware.check_admin;
  var jsonHandler = middleware.jsonHandler;

  app.get('/admin/users', check_admin, function(request, response, next) {
    models.User.find(jsonHandler(response, next));
  });

  app.post('/admin/users/register', check_admin, function(request, response, next) {
    var options = request.body;
    models.User.register(options, jsonHandler(response, next));
  });

  app.post('/admin/users/delete', check_admin, function(request, response, next) {
    var user_id = request.body.user;
    models.User.delete_user(user_id, jsonHandler(response, next));
  });

};
