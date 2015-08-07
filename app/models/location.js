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

// Get summary information for a given location
//
// 1. location_id: integer. ex. 1738
// 2. callback: function to return the information
Location.show_information = function(location_id, callback) {
	var sql = multiline(function() {;/*
		select
		  location_id,
		  sum(entry_fee)::integer as entry_fee,
		  sum(install_cost)::integer as business_install_costs,
		  sum(install_cost_per_hh)::integer as household_install_costs,
		  sum(number_of_households)::integer as number_of_households,
		  sum(number_of_businesses)::integer as number_of_businesses
		from (
		  select
		    location_id, entry_fee, 0 as install_cost, 0 as install_cost_per_hh, 0 as number_of_households, 0 as number_of_businesses
		  from
		    client.location_entry_fees
		  where
		    location_id=$1

		  union

		  select
		    location_id, 0, install_cost, 0, 0, 0
		  from
		    client.business_install_costs
		  join businesses
		    on businesses.id = business_install_costs.business_id
		  where
		    location_id=$1

		  union

		  select
		    location_id, 0, 0, install_cost_per_hh, 0, 0
		  from
		    client.household_install_costs
		  where
		    location_id=$1

		  union

		  select
		    location_id, 0, 0, 0, households.number_of_households, 0
		  from
		    aro.households
		  where
		    households.location_id=$1

		  union

		  select
		    location_id, 0, 0, 0, 0, count(*)
		  from
		    businesses
		  where
		    location_id=$1
		  group by
		    location_id

		) t group by location_id;
	*/});
	database.findOne(sql, [location_id], callback)
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
			'POINT('+values.lon+' '+values.lat+')',
		]
		var sql = multiline(function() {;/*
			INSERT INTO aro.locations
				(address, lat, lon, city, state, zipcode, geog, geom)
			VALUES ($1, $2, $3, $4, $5, $6, ST_GeogFromText($7), ST_GeomFromText($8, 4326))
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

Location.update_households = function(location_id, values, callback) {
	var params = [
		values.number_of_households,
		location_id,
	];
	txain(function(callback) {
		var sql = multiline(function() {;/*
			UPDATE aro.households
			SET
				number_of_households = $1
			WHERE
				location_id = $2;
		*/});
		database.execute(sql, params, callback);
	})
	.then(function(rowCount, callback) {
		if (rowCount > 0) return callback(null, 1);
		var sql = multiline(function() {;/*
			INSERT INTO aro.households
				(number_of_households, location_id)
			VALUES ($1, $2)
		*/});
		database.execute(sql, params, callback);
	})
	.end(callback);
}

Location.show_businesses = function(location_id, callback) {
	var sql = multiline(function() {;/*
		SELECT
			businesses.id,
			businesses.industry_id,
			businesses.name,
			businesses.number_of_employees,
			costs.install_cost,
			costs.annual_recurring_cost
		FROM
			aro.businesses businesses
		JOIN
			client.business_install_costs costs
		ON
			costs.business_id = businesses.id
		WHERE
			location_id = $1
	*/});
	database.query(sql, [location_id], callback);
}

module.exports = Location;
