// Network
//

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');
var _ = require('underscore');
var request = require('request');
var config = helpers.config;

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

// View the user client's network nodes
// 
// 1. node_type String (ex. 'central_office', 'fiber_distribution_hub', 'fiber_distribution_terminal')
// 2. route_id Number Pass a route_id to find additionally the network nodes associated to that route
Network.view_network_nodes = function(node_types, route_id, callback) {
  var sql = multiline(function() {;/*
    SELECT
      n.id, ST_AsGeoJSON(geog)::json AS geom, t.name AS name, n.route_id
    FROM client.network_nodes n
    JOIN client.network_node_types t
      ON n.node_type_id = t.id
  */});

  var params = [];
  var constraints = [];

  if (node_types && node_types.length > 0) {
    var arr = [];
    node_types.forEach(function(node_type) {
      params.push(node_type);
      arr.push('t.name = $'+params.length);
    });
    constraints.push('('+arr.join(' OR ')+')');
  }

  if (route_id) {
    params.push(route_id);
    constraints.push('(route_id IS NULL OR route_id=$'+params.length+')');
  } else {
    constraints.push('route_id IS NULL');
  }

  if (constraints.length > 0) {
    sql += ' WHERE '+constraints.join(' AND ');
  }

  txain(function(callback) {
    database.query(sql, params, callback);
  })
  .then(function(rows, callback) {
    var features = rows.map(function(row) {
      return {
        'type': 'Feature',
        'properties': {
          'id': row.id,
          'type' : row.name,
          'icon': '/images/map_icons/'+row.name+'.png',
          'unselectable': row.name !== 'central_office',
          'draggable': !!row.route_id,
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
    callback(null, output);
  })
  .end(callback)
};

// View all the available network node types
Network.view_network_node_types = function(callback) {
  var sql = 'SELECT * FROM client.network_node_types';
  database.query(sql, callback);
};

Network.edit_network_nodes = function(route_id, changes, callback) {
  txain(function(callback) {
    add_nodes(route_id, changes.insertions, callback);
  })
  .then(function(callback) {
    update_nodes(route_id, changes.updates, callback);
  })
  .then(function(callback) {
    delete_nodes(route_id, changes.deletions, callback);
  })
  .then(function(callback) {
    var sql = 'UPDATE custom.route SET updated_at=NOW() WHERE id=$1'
    database.execute(sql, [route_id], callback);
  })
  .end(callback);
};

function add_nodes(route_id, insertions, callback) {
  if (!_.isArray(insertions) || insertions.length === 0) return callback();
  var sql = 'INSERT INTO client.network_nodes (node_type_id, geog, geom, route_id) VALUES '
  var params = [];
  var arr = [];
  insertions.forEach(function(node) {
    var i = params.length;
    params.push(node.type);
    params.push('POINT('+node.lon+' '+node.lat+')');
    params.push('POINT('+node.lon+' '+node.lat+')');
    params.push(route_id);
    arr.push('($'+(i+1)+', ST_GeogFromText($'+(i+2)+'), ST_GeomFromText($'+(i+3)+', 4326), $'+(i+4)+')');
  });
  sql += arr.join(', ');
  database.execute(sql, params, callback);
};

function update_nodes(route_id, updates, callback) {
  if (!_.isArray(updates) || updates.length === 0) return callback();
  txain(updates)
  .each(function(node, callback) {
    var sql = 'UPDATE client.network_nodes SET geog=ST_GeogFromText($1), geom=ST_GeomFromText($2, 4326) WHERE id=$3'
    var params = [
      'POINT('+node.lon+' '+node.lat+')',
      'POINT('+node.lon+' '+node.lat+')',
      node.id
    ];
    database.execute(sql, params, callback);
  })
  .end(callback);
};

function delete_nodes(route_id, updates, callback) {
  if (!_.isArray(updates) || updates.length === 0) return callback();
  txain(updates)
  .each(function(node, callback) {
    var sql = 'DELETE FROM client.network_nodes WHERE id=$1 AND route_id IS NOT NULL';
    var params = [node.id];
    database.execute(sql, params, callback);
  })
  .end(callback);
};

Network.clear_network_nodes = function(route_id, callback) {
  var sql = 'DELETE FROM client.network_nodes WHERE route_id=$1;';
  database.execute(sql, [route_id], callback);
};

Network.recalculate_nodes = function(route_id, callback) {
  txain(function(callback) {
    var options = {
      method: 'POST',
      url: config.aro_service_url+'/rest/recalc/plan',
      json: true,
      body: {
        planId: route_id,
      },
    };
    console.log('options', options);
    request(options, callback);
  })
  .then(function(res, body, callback) {
    console.log('body', body);
    callback();
  })
  .end(callback);
};

module.exports = Network;
