// CensusBlock 
//
// The County Subdivision is a geographic area used in map layers.

var helpers = require('../helpers');
var database = helpers.database;
var GeoJsonHelper = helpers.GeoJsonHelper;
var txain = require('txain');

var CensusBlock = {};

// Find all Census Blocks in a US state by querying the `statefp` field
//
// 1. database: 'pg' from var pg = require('pg')
// 2. con_string: 'con_string' from var con_string = 'postgres://aro:aro@localhost/aro'
// 3. statefp: String. ex. '36' is New York state
// 4. callback: function to return a GeoJSON object
CensusBlock.find_by_statefp = function(statefp, callback) {
	var sql = 'SELECT ST_AsGeoJSON(geom)::json AS geom FROM aro.census_blocks WHERE statefp = $1';
	var params = [statefp];

	txain(function(callback) {
	  database.query(sql, params, callback);
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


CensusBlock.find_by_statefp_and_countyfp = function(statefp, countyfp, callback) {
	var sql = 'SELECT ST_AsGeoJSON(geom)::json AS geom FROM aro.census_blocks WHERE statefp = $1 AND countyfp = $2';
	var params = [statefp, countyfp];

	txain(function(callback) {
	  database.query(sql, params, callback);
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

module.exports = CensusBlock;
