// Network
//

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');

var Network = {};

// View existing fiber plant for a carrier
// This does not show the user client's fiber plant by default since we need to handle competitors' fiber plant as well.
//
// 1. callback: function to return the GeoJSON for a wirecenter
Network.view_fiber_plant_for_carrier = function(carrier_name, callback) {
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

// View the user client's network nodes by type
// 
// 1. node_type String (ex. 'central_office', 'fiber_distribution_hub', 'fiber_distribution_terminal')
Network.view_network_nodes_by_type = function(node_type, callback) {
  var sql = 'SELECT n.id, ST_AsGeoJSON(geom)::json AS geom FROM client.network_nodes n join client.network_node_types t on n.node_type_id = t.id WHERE n.name = $1';

  txain(function(callback) {
    database.query(sql, [node_type], callback);
  })
  .then(function(rows, callback) {
    var features = rows.map(function(row) {
      return {
        'type': 'Feature',
        'properties': {
          'id': row.id,
          'type' : node_type
        },
        'geometry': row.geom,
      }
    });

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

module.exports = Network;
