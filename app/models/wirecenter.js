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
Wirecenter.find_by_wirecenter_code = function(wirecenter_code, callback) {
  var sql = 'SELECT id, ST_AsGeoJSON(geom)::json as geom FROM aro.wirecenters WHERE wirecenter = $1;';

  txain(function(callback) {
    database.query(sql, [wirecenter_code], callback);
  })
  .then(function(rows, callback) {
    var features = rows.map(function(row) {
      return {
        'type': 'Feature',
        'properties': {
          'id': row.id,
          'name': row.name,
        },
        'geometry': row.geom,
      }
    });

    var output = {
      'feature_collection': {
        'type':'FeatureCollection',
        'features': features,
      },
    };
    callback(null, output);
  })
  .end(callback);
};

module.exports = Wirecenter;
