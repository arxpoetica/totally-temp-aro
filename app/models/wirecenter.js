// Wirecenter
//

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');

var Wirecenter = {};

// Find all Wirecenters
//
// 1. callback: function to return the list of wirecenters
Wirecenter.find_all = function(callback) {
  var sql = 'SELECT id, ST_AsGeoJSON(geom)::json as geom, ST_AsGeoJSON(st_centroid(geom))::json as centroid FROM wirecenters WHERE wirecenter=$1;';

  txain(function(callback) {
    database.query(sql, ['NYCMNY79'], callback);
  })
  .then(function(rows, callback) {
    callback(null, rows);
  })
  .end(callback);
};

module.exports = Wirecenter;
