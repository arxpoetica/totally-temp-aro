// SplicePoint 
//
// The Splice Point is a point on the carrier's network from which fiber may be extended.

var helpers = require('../helpers');
var database = helpers.database;
var multiline = require('multiline');
var txain = require('txain');

// Empty constructor for now
var SplicePoint = {};

// Find all Splice Points for a given carrier
//
// 1. carrier_name: String. ex. 'VERIZON'
// 2. callback: function to return a GeoJSON object
SplicePoint.find_by_carrier = function(carrier_name, callback) {
	var sql = 'SELECT id, ST_AsGeoJSON(geom)::json AS geom FROM aro.splice_points WHERE carrier_name = $1';
	txain(function(callback) {
		database.query(sql, [carrier_name], callback);
	})
	.then(function(rows, callback) {
		var features = rows.map(function(row) {
			return {
				'type':'Feature',
				'properties': {
					'id': row.id,
				},
				'geometry': row.geom,
			}
		});
		var feature_collection = {
			'type':'FeatureCollection',
			'features': features,
		};

		var output = {
			'feature_collection': feature_collection,
		};

		callback(null, output);
	})
	.end(callback)
};

module.exports = SplicePoint;
