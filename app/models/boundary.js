// Boundary

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');

var Boundary = {};

Boundary.create_boundary = function(route_id, data, callback) {
  txain(function(callback) {
    var sql = 'INSERT INTO custom.boundaries (route_id, name, geom) VALUES ($1, $2, ST_GeomFromGeoJSON($3)) RETURNING id';
    var params = [
      route_id,
      data.name,
      data.geom,
    ];
    database.findOne(sql, params, callback);
  })
  .then(function(row, callback) {
    var sql = 'SELECT id, name, ST_ASGeoJSON(geom)::json as geom from custom.boundaries WHERE id=$1';
    database.findOne(sql, [row.id], callback);
  })
  .end(callback);
};

Boundary.delete_boundary = function(route_id, boundary_id, callback) {
  var sql = 'DELETE FROM custom.boundaries WHERE id=$1 AND route_id=$2';
  database.execute(sql, [boundary_id, route_id], callback);
};

Boundary.edit_boundary = function(data, callback) {
  var sql = 'UPDATE custom.boundaries SET name=$1, geom=ST_GeomFromGeoJSON($2) WHERE id=$3 AND route_id=$4';
  var params = [
    data.name,
    data.geom,
    data.id,
    data.route_id, // this may look redundant but it's for permissions checking
  ];
  database.execute(sql, params, callback);
};

Boundary.find_boundaries = function(route_id, callback) {
  var sql = 'SELECT id, name, ST_ASGeoJSON(geom)::json as geom from custom.boundaries WHERE route_id=$1';
  database.query(sql, [route_id], callback);
};

module.exports = Boundary;
