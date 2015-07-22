// Location 
//
// A Location is a point in space which can contain other objects such as businesses and households

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');

var Location = {};

// Find all Locations
//
// 1. callback: function to return a GeoJSON object
Location.find_all = function(callback) {
	var sql = 'SELECT id, ST_AsGeoJSON(geog)::json AS geom FROM aro.locations';

	txain(function(callback) {
		database.query(sql, callback);
	})
	.then(function(rows, callback) {
		var features = rows.map(function(row) {
			return {
				'type':'Feature',
				'properties': {
					'id': row.id,
				},
				'geometry': row.geom,
			};
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

// Get the closest vertex to a Location.
// This is used when selecting a Location to be the target in a route plan, since it overlaps with a vertex
//
// 1. location_id: integer. ex. 1738
// 2. callback: function to return a GeoJSON object
Location.get_closest_vertex = function(location_id, callback) {
	var sql = multiline(function() {/*
		SELECT
			vertex.id AS vertex_id
		FROM
			client.graph_vertices_pgr AS vertex
		JOIN aro.locations locations
			ON locations.geom && vertex.the_geom
		WHERE
			locations.id = $1
	*/});
	database.findOne(sql, [location_id], callback)
}

// Get house hold summary information for a given location
//
// 1. location_id: integer. ex. 1738
// 2. callback: function to return the information
Location.get_house_hold_summary = function(location_id, callback) {
	var sql = multiline(function() {/*
		SELECT
			number_of_households, install_cost_per_hh, annual_recurring_cost_per_hh
		FROM
			aro.household_summary
		WHERE
			location_id = $1
	*/});
	database.findOne(sql, [location_id], callback)
}

Location.total_service_cost = function(location_id, callback) {
	var sql = multiline(function() {/*
		SELECT
			locations.entry_fee, sum(businesses.install_cost) total_install_costs
		FROM
			aro.locations locations
		JOIN aro.businesses businesses
			ON businesses.location_id = $1
		GROUP BY locations.entry_fee
	*/});
	database.findOne(sql, [location_id], callback)
}

module.exports = Location;
