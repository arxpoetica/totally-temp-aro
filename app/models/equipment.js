// Equipment
//

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');

var Equipment = {};

// Find equipment for a given carrier
//
// 1. callback: function to return the list of wirecenters
Equipment.find_by_carrier = function(carrier_name, callback) {
  var sql = 'SELECT ST_AsGeoJSON(geom)::json AS geom FROM aro.fiber_plant WHERE carrier_name = $1';

  txain(function(callback) {
    database.query(sql, [carrier_name], callback);
  })
  .then(function(rows, callback) {
    var features = rows.map(function(row) {
      return {
        'type': 'Feature',
        'geometry': row.geom,
      }
    })

    var output = {
      'feature_collection': {
        'type':'FeatureCollection',
        'features': features
      },
    };
    callback(null, output)
  })
  .end(callback)
};

module.exports = Equipment;
