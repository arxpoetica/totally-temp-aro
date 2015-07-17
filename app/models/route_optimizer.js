// Route Optimizer 
//
// The Route Optimizer finds shortest paths between sources and targets

var helpers = require('../helpers');
var database = helpers.database;
var multiline = require('multiline');
var txain = require('txain');

var RouteOptimizer = {};

// Find the shortest path between a source and target
//
// 1. source: integer. From the 'source' column of aro.graph. This will be the source id of the edge that joins the source location to the graph.
// 2. target: integer. From the 'target' column of aro.graph. This will be the source id of the edge that joins the target location to the graph.
// 3. callback: function to return a GeoJSON object
RouteOptimizer.shortest_path = function(source, targets, cost_per_meter, callback) {
	var sql = multiline(function() {/*
		SELECT id, edge_length, ST_AsGeoJSON(edge.geom)::json AS geom
		FROM 
			pgr_kdijkstraPath('SELECT id, source::integer, target::integer, edge_length::double precision AS cost FROM client.graph',
				$1, $2, false, false) AS dk
		JOIN client.graph edge
			ON edge.id = dk.id3
	*/});
	var target_array = targets.split(',');
	target_array = '{' + target_array.join(',') + '}';

	txain(function(callback) {
		database.query(sql, [source, target_array], callback);
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
		})

		var feature_collection = {
			'type':'FeatureCollection',
			'features': features,
		};

		var metadata = {
			'total_cost': total_cost_of_route(feature_collection, cost_per_meter),
		};

		var output = {
			'feature_collection': feature_collection,
			'metadata': metadata
		};

		callback(null, output);
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
	})
};

module.exports = RouteOptimizer;
