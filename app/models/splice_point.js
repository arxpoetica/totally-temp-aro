// SplicePoint 
//
// The Splice Point is a point on the carrier's network from which fiber may be extended.

var icon = 'splice_point.png'
var helpers = require('../helpers');
var database = helpers.database;
var multiline = require('multiline');
var txain = require('txain');

// Empty constructor for now
function SplicePoint() {
}

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
					'icon': icon,
					'id': row.id,
				},
				'geometry': row.geom,
			}
		})
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

// Get the closest vertex to a Splice Point.
// This is used when selecting a splice point to be the source in a route plan, since it overlaps with a vertex
//
// 1. splice_point_id: integer. ex. 1738
// 2. callback: function to return a GeoJSON object
SplicePoint.get_closest_vertex = function(splice_point_id, callback) {
	var sql = multiline(function() {/*
		SELECT id, edge_length, ST_AsGeoJSON(edge.geom)::json AS geom
		FROM 
			pgr_kdijkstraPath('SELECT id, source::integer, target::integer, edge_length::double precision AS cost FROM client.graph',
				$1, $2, false, false) AS dk
		JOIN client.graph edge
			ON edge.id = dk.id3
	*/});
	database.findOne(sql, [splice_point_id], callback);
}

module.exports = SplicePoint;
