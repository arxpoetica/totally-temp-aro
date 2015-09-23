var models = require('./models');
var _ = require('underscore');

function jsonHandler(response, next) {
  return function(err, data) {
    if (err) return next(err);
    if (_.isUndefined(data) || _.isNull(data)) data = {};
    response.json(data);
  }
};

function check_permission(rol) {
  return function(request, response, next) {
    var user = request.user;
    var plan_id = request.params.plan_id;
    models.Permission.find_permission(plan_id, user.id, function(err, permission) {
      if (err) return next(err);
      if (process.env.NODE_ENV === 'test') return next();
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
