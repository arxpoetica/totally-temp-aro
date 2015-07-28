// Route Optimizer 
//
// The Route Optimizer finds shortest paths between sources and targets

var helpers = require('../helpers');
var database = helpers.database;
var multiline = require('multiline');
var txain = require('txain');
var Location = require('./location');
var _ = require('underscore');

var RouteOptimizer = {};

RouteOptimizer.find_route = function(route_id, callback) {
  var cost_per_meter = 200;
  var output = {};

  txain(function(callback) {
    var sql = multiline(function() {/*
      SELECT edge.id, edge.edge_length, ST_AsGeoJSON(edge.geom)::json AS geom
      FROM route_edges
      JOIN client.graph edge
        ON edge.id = route_edges.edge_id
      WHERE route_edges.route_id=$1
    */});
    database.query(sql, [route_id], callback);
  })
  .then(function(rows, callback) {
    var features = rows.map(function(row) {
      return {
        'type':'Feature',
        'properties': {
          'length_in_meters': row.edge_length,
        },
        'geometry': row.geom,
      }
    });

    var feature_collection = {
      'type':'FeatureCollection',
      'features': features,
    };

    var metadata = {
      'total_cost': total_cost_of_route(feature_collection, cost_per_meter),
    };

    output = {
      'feature_collection': feature_collection,
      'metadata': metadata
    };
    callback();
  })
  .then(function(output, callback) {
    var sql = multiline(function() {/*
      SELECT location_id AS id
      FROM route_targets
      WHERE route_id=$1
    */});
    database.query(sql, [route_id], callback);
  })
  .then(function(targets, callback) {
    output.metadata.targets = targets.map(function(row) { return +row.id });
    var sql = multiline(function() {/*
      SELECT splice_point_id AS id
      FROM route_sources
      WHERE route_id=$1
    */});
    database.query(sql, [route_id], callback);
  })
  .then(function(sources, callback) {
    output.metadata.sources = sources.map(function(row) { return +row.id });
    callback(null, output);
  })
  .end(callback);
}

RouteOptimizer.recalculate_route = function(route_id, callback) {
  txain(function(callback) {
    var sql = 'DELETE FROM route_edges WHERE route_id=$1'
    database.query(sql, [route_id], callback);
  })
  .then(function(callback) {
    var sql = multiline(function() {/*
      WITH edges AS (
        SELECT DISTINCT edge_id FROM
          (SELECT id as edge_id
              FROM
                pgr_kdijkstraPath('SELECT id, source::integer, target::integer, edge_length::double precision AS cost FROM client.graph',
                  (select vertex_id from route_sources where route_id=$1 limit 1)::integer,
                  array(select vertex_id from route_targets where route_id=$1)::integer[],
                  false, false) AS dk
              JOIN client.graph edge
                ON edge.id = dk.id3) as edge_id
      )
      INSERT INTO route_edges (edge_id, route_id) (SELECT edge_id, $1 as route_id FROM edges);
    */});
    database.execute(sql, [route_id], function(err) {
      if (err && err.message.indexOf('One of the target vertices was not found or several targets are the same') >= 0) return callback(); // ignore this error
      return callback(err);
    });
  })
  .end(callback);
};

RouteOptimizer.recalculate_and_find_route = function(route_id, callback) {
  txain(function(callback) {
    RouteOptimizer.recalculate_route(route_id, callback);
  })
  .then(function(callback) {
    RouteOptimizer.find_route(route_id, callback);
  })
  .end(callback);
};

// Get the total CapEx for creating a route
//
// route: GeoJSON FeatureCollection output by the `shortest_path` function above
// cost_per_meter: decimal number. ex. 12.3
function total_cost_of_route(route, cost_per_meter) {
  return cost_per_meter * route.features.map(function(feature) {
    return feature.properties.length_in_meters
  })
  .reduce(function(total, current) {
    return total + current
  }, 0);
};

RouteOptimizer.find_all = function(callback) {
  var sql = 'SELECT id, name, number_of_strands FROM route;';
  database.query(sql, callback);
};

RouteOptimizer.create_route = function(callback) {
  txain(function(callback) {
    var sql = 'INSERT INTO route (name) VALUES ($1) RETURNING id;';
    database.findOne(sql, ['Untitled route'], callback);
  })
  .then(function(row, callback) {
    var sql = 'SELECT id, name, number_of_strands FROM route WHERE id=$1;';
    database.findOne(sql, [row.id], callback);
  })
  .end(callback);
};

RouteOptimizer.delete_route = function(route_id, callback) {
  var sql = multiline(function() {/*
    DELETE FROM route WHERE id=$1;
  */});
  database.execute(sql, [route_id], callback);
};

RouteOptimizer.save_route = function(route_id, data, callback) {
  var fields = [];
  var params = [];
  var allowed_fields = ['name'];
  _.intersection(_.keys(data), allowed_fields).forEach(function(key) {
    params.push(data[key]);
    fields.push(key+'=$'+params.length);
  });
  if (fields.length === 0) return callback();

  params.push(route_id);
  var sql = 'UPDATE route SET '+fields.join(', ')+' WHERE id=$'+params.length;
  database.execute(sql, params, callback);
};

RouteOptimizer.edit_route = function(route_id, changes, callback) {
  txain(function(callback) {
    add_sources(route_id, changes.insertions && changes.insertions.splice_points, callback);
  })
  .then(function(callback) {
    add_targets(route_id, changes.insertions && changes.insertions.locations, callback);
  })
  .then(function(callback) {
    delete_sources(route_id, changes.deletions && changes.deletions.splice_points, callback);
  })
  .then(function(callback) {
    delete_targets(route_id, changes.deletions && changes.deletions.locations, callback);
  })
  .then(function() {
    RouteOptimizer.recalculate_and_find_route(route_id, callback);
  })
  .end(callback);
};

function add_sources(route_id, splice_point_ids, callback) {
  if (!_.isArray(splice_point_ids) || splice_point_ids.length === 0) return callback();

  txain(function(callback) {
    // avoid duplicates
    var sql = multiline(function() {/*
      DELETE FROM route_sources
      WHERE route_id=$1 AND splice_point_id IN ($2)
    */});
    database.execute(sql, [route_id, splice_point_ids], callback);
  })
  .then(function(callback) {
    // calculate closest vertex
    var sql = multiline(function() {/*
      INSERT INTO route_sources (vertex_id, splice_point_id, route_id)
      (SELECT
        vertex.id AS vertex_id, splice_points.id, $2
      FROM
        client.graph_vertices_pgr AS vertex
      JOIN aro.splice_points splice_points
        ON splice_points.geom && vertex.the_geom
      WHERE
        splice_points.id IN ($1))
    */});
    database.execute(sql, [splice_point_ids, route_id], callback);
  })
  .end(callback);
};

function add_targets(route_id, location_ids, callback) {
  if (!_.isArray(location_ids) || location_ids.length === 0) return callback();

  txain(function(callback) {
    // avoid duplicates
    var sql = multiline(function() {/*
      DELETE FROM route_targets
      WHERE route_id=$1 AND location_id IN ($2)
    */});
    database.execute(sql, [route_id, location_ids], callback);
  })
  .then(function(callback) {
    // calculate closest vertex
    var sql = multiline(function() {/*
      INSERT INTO route_targets (vertex_id, location_id, route_id)
      (SELECT
        vertex.id AS vertex_id, locations.id, $2 AS route_id
      FROM
        client.graph_vertices_pgr AS vertex
      JOIN aro.locations locations
        ON locations.geom && vertex.the_geom
      WHERE
        locations.id IN ($1))
    */});
    database.execute(sql, [location_ids, route_id], callback);
  })
  .end(callback);
};

function delete_sources(route_id, splice_point_ids, callback) {
  if (!_.isArray(splice_point_ids) || splice_point_ids.length === 0) return callback();

  txain(splice_point_ids)
  .each(function(splice_point_id, callback) {
    var sql = multiline(function() {/*
      DELETE FROM route_sources
      WHERE route_id=$1 AND splice_point_id=$2
    */});
    database.execute(sql, [route_id, splice_point_id], callback);
  })
  .then(function() {
    RouteOptimizer.recalculate_and_find_route(route_id, callback);
  })
  .end(callback);
};

function delete_targets(route_id, location_ids, callback) {
  if (!_.isArray(location_ids) || location_ids.length === 0) return callback();

  txain(location_ids)
  .each(function(location_id, callback) {
    var sql = multiline(function() {/*
      DELETE FROM route_targets
      WHERE route_id=$1 AND location_id=$2
    */});
    database.execute(sql, [route_id, location_id], callback);
  })
  .end(callback);
};

module.exports = RouteOptimizer;
