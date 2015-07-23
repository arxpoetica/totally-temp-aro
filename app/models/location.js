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
			location_id, number_of_households, install_cost_per_hh, annual_recurring_cost_per_hh
		FROM
			aro.household_summary
		WHERE
			location_id = $1
	*/});
	var def = {
		location_id: location_id,
		number_of_households: 0,
		install_cost_per_hh: 0,
		annual_recurring_cost_per_hh: 0,
	}
	database.findOne(sql, [location_id], def, callback)
}

Location.create_location = function(values, callback) {
	txain(function(callback) {
		var params = [
			values.address,
			values.lat,
			values.lon,
			values.city,
			values.state,
			values.zipcode,
			'POINT('+values.lon+' '+values.lat+')',
		]
		var sql = multiline(function() {/*
			INSERT INTO aro.locations
				(address, lat, lon, city, state, zipcode, geog)
			VALUES ($1, $2, $3, $4, $5, $6, ST_GeogFromText($7))
			RETURNING id
		*/});
		database.findOne(sql, params, callback);
	})
	.then(function(row, callback) {
		var location_id = row.id;
		var sql = 'SELECT id, ST_AsGeoJSON(geog)::json AS geom FROM aro.locations where id=$1';
		database.findOne(sql, [location_id], callback);
	})
	.then(function(row, callback) {
		callback(null, {
			'type':'Feature',
			'properties': {
				'id': row.id,
			},
			'geometry': row.geom,
		});
	})
	.end(callback);
}

Location.update_house_hold_summary = function(location_id, values, callback) {
	var params = [
		values.number_of_households,
		location_id,
	];
	txain(function(callback) {
		var sql = multiline(function() {/*
			UPDATE aro.household_summary
			SET
				number_of_households = $1
			WHERE
				location_id = $2;
		*/});
		database.execute(sql, params, callback);
	})
	.then(function(rowCount, callback) {
		if (rowCount > 0) return callback();
		var sql = multiline(function() {/*
			INSERT INTO aro.household_summary
				(number_of_households, location_id)
			VALUES ($1, $2)
		*/});
		database.execute(sql, params, callback);
	})
	.end(callback);
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
