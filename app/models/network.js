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
Network.view_fiber_plant_for_carrier = function(carrier_name, viewport, callback) {
  txain(function(callback) {
    if (viewport.zoom > viewport.threshold) {
      var sql = 'SELECT ST_AsGeoJSON(geom)::json AS geom FROM aro.fiber_plant WHERE carrier_name = $1 AND ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($2)), 4326), geom)';
      database.query(sql, [carrier_name, viewport.linestring], callback);
    } else {
      var sql = 'WITH '+viewport.fishnet;
      sql += multiline(function() {;/*
        SELECT ST_AsGeojson(fishnet.geom)::json AS geom, COUNT(*) AS density, NULL AS id
        FROM fishnet
        JOIN aro.fiber_plant ON fishnet.geom && fiber_plant.geom
        AND fiber_plant.carrier_name = $1
        GROUP BY fishnet.geom
      */});
      database.query(sql, [carrier_name], callback);
    }
  })
  .then(function(rows, callback) {
    var features = rows.map(function(row) {
      return {
        type: 'Feature',
        geometry: row.geom,
        properties: {
          // density: row.density,
        }
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

// View existing fiber plant for competitors
Network.view_fiber_plant_for_competitors = function(viewport, callback) {
  txain(function(callback) {
    if (viewport.zoom > viewport.threshold) {
      var sql = 'SELECT ST_AsGeoJSON(geom)::json AS geom FROM aro.fiber_plant WHERE carrier_name <> $1 AND ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($2)), 4326), geom)';
      database.query(sql, [config.client_carrier_name, viewport.linestring], callback);
    } else {
      callback(null, []);
    }
  })
  .then(function(rows, callback) {
    var features = rows.map(function(row) {
      return {
        type: 'Feature',
        geometry: row.geom,
        properties: {
          density: row.density,
        }
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

// View existing fiber plant for competitors with a heat map
Network.view_fiber_plant_density = function(viewport, callback) {
  txain(function(callback) {
    var sql = 'WITH '+viewport.fishnet;
    sql += multiline(function() {;/*
      SELECT ST_AsGeojson(fishnet.geom)::json AS geom, COUNT(DISTINCT fiber_plant.carrier_name) AS density, NULL AS id
      FROM fishnet
      JOIN aro.fiber_plant ON fishnet.geom && fiber_plant.geom
      AND fiber_plant.carrier_name <> $1
      GROUP BY fishnet.geom
    */});
    database.query(sql, [config.client_carrier_name], callback);
  })
  .then(function(rows, callback) {
    var features = rows.map(function(row) {
      return {
        type: 'Feature',
        geometry: row.geom,
        properties: {
          density: row.density,
        }
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

Network.carrier_names = function(callback) {
  txain(function(callback) {
    var sql = 'SELECT distinct(carrier_name) FROM fiber_plant ORDER BY carrier_name ASC';
    database.query(sql, callback);
  })
  .then(function(rows, callback) {
    var names = rows.map(function(carrier) {
      return carrier.carrier_name;
    });
    names = _.without(names, config.client_carrier_name);
    callback(null, names);
  })
  .end(callback);
};

// View the user client's network nodes
// 
// 1. node_type String (ex. 'central_office', 'fiber_distribution_hub', 'fiber_distribution_terminal')
// 2. route_id Number Pass a route_id to find additionally the network nodes associated to that route
Network.view_network_nodes = function(node_types, plan_id, callback) {
  var sql = multiline(function() {;/*
    SELECT
      n.id, ST_AsGeoJSON(geog)::json AS geom, t.name AS name, n.route_id
    FROM client_schema.network_nodes n
    JOIN client_schema.network_node_types t
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

  if (plan_id) {
    params.push(plan_id);
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
  var sql = 'SELECT * FROM client_schema.network_node_types';
  database.query(sql, callback);
};

Network.edit_network_nodes = function(plan_id, changes, callback) {
  txain(function(callback) {
    add_nodes(plan_id, changes.insertions, callback);
  })
  .then(function(callback) {
    update_nodes(plan_id, changes.updates, callback);
  })
  .then(function(callback) {
    delete_nodes(plan_id, changes.deletions, callback);
  })
  .then(function(callback) {
    var sql = 'UPDATE custom.route SET updated_at=NOW() WHERE id=$1'
    database.execute(sql, [plan_id], callback);
  })
  .end(callback);
};

function add_nodes(plan_id, insertions, callback) {
  if (!_.isArray(insertions) || insertions.length === 0) return callback();
  var sql = 'INSERT INTO client_schema.network_nodes (node_type_id, geog, geom, route_id) VALUES '
  var params = [];
  var arr = [];
  insertions.forEach(function(node) {
    var i = params.length;
    params.push(node.type);
    params.push('POINT('+node.lon+' '+node.lat+')');
    params.push('POINT('+node.lon+' '+node.lat+')');
    params.push(plan_id);
    arr.push('($'+(i+1)+', ST_GeogFromText($'+(i+2)+'), ST_GeomFromText($'+(i+3)+', 4326), $'+(i+4)+')');
  });
  sql += arr.join(', ');
  database.execute(sql, params, callback);
};

function update_nodes(plan_id, updates, callback) {
  if (!_.isArray(updates) || updates.length === 0) return callback();
  txain(updates)
  .each(function(node, callback) {
    var sql = 'UPDATE client_schema.network_nodes SET geog=ST_GeogFromText($1), geom=ST_GeomFromText($2, 4326) WHERE id=$3 AND route_id=$4'
    var params = [
      'POINT('+node.lon+' '+node.lat+')',
      'POINT('+node.lon+' '+node.lat+')',
      node.id,
      plan_id,
    ];
    database.execute(sql, params, callback);
  })
  .end(callback);
};

function delete_nodes(plan_id, updates, callback) {
  if (!_.isArray(updates) || updates.length === 0) return callback();
  txain(updates)
  .each(function(node, callback) {
    var sql = 'DELETE FROM client_schema.network_nodes WHERE id=$1 AND route_id=$2';
    var params = [node.id, plan_id];
    database.execute(sql, params, callback);
  })
  .end(callback);
};

Network.clear_network_nodes = function(plan_id, callback) {
  var sql = 'DELETE FROM client_schema.network_nodes WHERE route_id=$1;';
  database.execute(sql, [plan_id], callback);
};

Network.recalculate_nodes = function(plan_id, callback) {
  txain(function(callback) {
    var options = {
      method: 'POST',
      url: config.aro_service_url+'/rest/recalc/plan',
      json: true,
      body: {
        planId: plan_id,
      },
    };
    request(options, callback);
  })
  .then(function(res, body, callback) {
    callback();
  })
  .end(callback);
};

module.exports = Network;
