// Boundary

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');

var Boundary = {};

Boundary.create_boundary = function(plan_id, data, callback) {
  txain(function(callback) {
    var sql = 'INSERT INTO client.plan_boundaries (plan_id, name, geom) VALUES ($1, $2, ST_GeomFromGeoJSON($3)) RETURNING id';
    var params = [
      plan_id,
      data.name,
      data.geom,
    ];
    database.findOne(sql, params, callback);
  })
  .then(function(row, callback) {
    var sql = 'SELECT id, name, ST_ASGeoJSON(geom)::json as geom from client.plan_boundaries WHERE id=$1';
    database.findOne(sql, [row.id], callback);
  })
  .end(callback);
};

Boundary.delete_boundary = function(plan_id, boundary_id, callback) {
  var sql = 'DELETE FROM client.plan_boundaries WHERE id=$1 AND plan_id=$2';
  database.execute(sql, [boundary_id, plan_id], callback);
};

Boundary.edit_boundary = function(data, callback) {
  var sql = 'UPDATE client.plan_boundaries SET name=$1, geom=ST_GeomFromGeoJSON($2) WHERE id=$3 AND plan_id=$4';
  var params = [
    data.name,
    data.geom,
    data.id,
    data.plan_id, // this may look redundant but it's for checking permissions
  ];
  database.execute(sql, params, callback);
};

Boundary.find_boundaries = function(plan_id, callback) {
  var sql = 'SELECT id, name, ST_ASGeoJSON(geom)::json as geom from client.plan_boundaries WHERE plan_id=$1';
  database.query(sql, [plan_id], callback);
};

module.exports = Boundary;
