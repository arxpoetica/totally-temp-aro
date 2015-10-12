var models = require('./models');
var _ = require('underscore');
var nook = require('node-errors').nook;

function jsonHandler(response, next) {
  return nook(next, function(data) {
    if (_.isUndefined(data) || _.isNull(data)) data = {};
    response.json(data);
  });
};

function check_permission(rol) {
  return function(request, response, next) {
    var user = request.user;
    var plan_id = request.params.plan_id;
    models.Permission.find_permission(plan_id, user.id, nook(next, function(permission) {
      // !rol means any permission is ok
      if (permission && (!rol || rol === permission.rol || permission.rol === 'owner')) {
        return next();
      }
      response.status(403).json({
        error: 'Forbidden',
      });
    }));
  };
};

function viewport(request, response, next) {
  var nelon = +request.query.nelon;
  var nelat = +request.query.nelat;
  var swlon = +request.query.swlon;
  var swlat = +request.query.swlat;
  var selon = nelon;
  var selat = swlat;
  var nwlon = swlon;
  var nwlat = nelat;
  var zoom = +request.query.zoom;

  request.viewport = {
    nelat: nelat,
    nelon: nelon,
    swlat: swlat,
    swlon: swlon,
    zoom: zoom,
    threshold: +request.query.threshold,
    simplify_factor: viewport.zoom > 14 ? 0 : 0.00015,
    linestring: 'LINESTRING('+nelon+' '+nelat+', '+selon+' '+selat+', '+swlon+' '+swlat+', '+nwlon+' '+nwlat+', '+nelon+' '+nelat+')',
    buffer: 10/Math.pow(2, zoom),
  };
  next();
}

var check_any_permission = check_permission(null);
var check_owner_permission = check_permission('owner');

module.exports = {
  check_any_permission: check_any_permission,
  check_owner_permission: check_owner_permission,
  jsonHandler: jsonHandler,
  viewport: viewport,
};
