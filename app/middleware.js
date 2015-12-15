var models = require('./models');
var helpers = require('./helpers');
var validate = helpers.validate;
var _ = require('underscore');
var nook = require('node-errors').nook;
var multiline = require('multiline');
var NodeCache = require('node-cache');
var cache = new NodeCache();
var crypto = require('crypto')

function cacheable(request, response, next) {
  var obj = {
    path: request.path,
    body: request.body,
    query: request.query,
  }
  var key = crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex');
  cache.get(key, function(err, value) {
    if (!value) {
      response.cache_key = key;
      if (err) {
        console.log('err', err);
        return next();
      }
      return next();
    }

    jsonHandler(response, next)(null, value);
  })
}

function jsonHandler(response, next) {
  return nook(next, function(data) {
    if (response.cache_key && data) {
      cache.set(response.cache_key, data)
    }
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

function check_admin(request, response, next) {
  var user = request.user;
  if (user.rol !== 'admin') {
    response.status(403).json({
      error: 'Forbidden',
    });
  }
  next();
};

function viewport(request, response, next) {
  var query = request.query;

  request.query.nelon = +request.query.nelon;
  request.query.nelat = +request.query.nelat;
  request.query.swlon = +request.query.swlon;
  request.query.swlat = +request.query.swlat;
  request.query.zoom = +request.query.zoom;
  request.query.threshold = +request.query.threshold;

  validate(function(expect) {
    expect(query, 'query_string.nelon', 'number');
    expect(query, 'query_string.nelat', 'number');
    expect(query, 'query_string.swlon', 'number');
    expect(query, 'query_string.swlat', 'number');
    expect(query, 'query_string.zoom', 'number');
    expect(query, 'query_string.threshold', 'number');
  }, function() {
    var nelon = request.query.nelon;
    var nelat = request.query.nelat;
    var swlon = request.query.swlon;
    var swlat = request.query.swlat;
    var selon = nelon;
    var selat = swlat;
    var nwlon = swlon;
    var nwlat = nelat;
    var zoom = request.query.zoom;
    var linestring = 'LINESTRING('+nelon+' '+nelat+', '+selon+' '+selat+', '+swlon+' '+swlat+', '+nwlon+' '+nwlat+', '+nelon+' '+nelat+')';

    request.viewport = {
      nelat: nelat,
      nelon: nelon,
      swlat: swlat,
      swlon: swlon,
      zoom: zoom,
      threshold: +request.query.threshold,
      simplify_factor: viewport.zoom > 14 ? 0 : 0.00015,
      linestring: linestring,
      buffer: 10/Math.pow(2, zoom),
      fishnet: multiline(function() {/*
        extent AS ( SELECT ST_SetSRID(ST_MakePolygon(ST_GeomFromText('$1')), 4326) as bbox ),
        bnds AS ( SELECT ST_XMin(bbox) as xmin, ST_YMin(bbox) as ymin, ST_XMax(bbox) as xmax, ST_YMax(bbox) as ymax FROM extent ),
        raster AS ( SELECT ST_AddBand(ST_MakeEmptyRaster(ceil((xmax-xmin)/$2)::integer, ceil((ymax-ymin)/$2)::integer, xmin, ymax, $2), '8BUI'::text, 200) AS rast FROM bnds ),
        fishnet AS ( SELECT ST_SetSRID((ST_PixelAsPolygons(rast)).geom, 4326) AS geom FROM raster )
      */}).replace(/\$1/g, linestring).replace(/\$2/g, 20/Math.pow(2, zoom))
    };
    next();

  }, next);
}

var check_any_permission = check_permission(null);
var check_owner_permission = check_permission('owner');

module.exports = {
  check_any_permission: check_any_permission,
  check_owner_permission: check_owner_permission,
  check_admin: check_admin,
  jsonHandler: jsonHandler,
  viewport: viewport,
  cacheable: cacheable,
};
