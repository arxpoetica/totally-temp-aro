var models = require('./models');

function jsonHandler(response, next) {
  return function(err, data) {
    if (err) return next(err);
    response.json(data || {});
  }
};

function check_permission(rol) {
  return function(request, response, next) {
    var user = request.user;
    var route_id = request.params.route_id;
    models.Permission.find_permission(route_id, user.id, function(err, permission) {
      if (err) return next(err);
      // !rol means any permission is ok
      if (permission && (!rol || rol === permission.rol || permission.rol === 'owner')) {
        return next();
      }
      response.status(403).json({
        error: 'Forbidden',
      });
    });
  };
};

var check_any_permission = check_permission(null);
var check_owner_permission = check_permission('owner');

module.exports = {
  check_any_permission: check_any_permission,
  check_owner_permission: check_owner_permission,
  jsonHandler: jsonHandler,
};
