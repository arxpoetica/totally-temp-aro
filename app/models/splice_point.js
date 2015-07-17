// SplicePoint 
//
// The Splice Point is a point on the carrier's network from which fiber may be extended.

var icon = 'splice_point.png'
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
					'icon': icon,
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

// Get the closest vertex to a Splice Point.
// This is used when selecting a splice point to be the source in a route plan, since it overlaps with a vertex
//
// 1. splice_point_id: integer. ex. 1738
// 2. callback: function to return a GeoJSON object
SplicePoint.get_closest_vertex = function(splice_point_id, callback) {
	var sql = multiline(function() {/*
		SELECT
			vertex.id AS vertex_id
		FROM
			client.graph_vertices_pgr AS vertex
		JOIN aro.splice_points splice_points
			ON splice_points.geom && vertex.the_geom
		WHERE
			splice_points.id = $1
	*/});
	database.findOne(sql, [splice_point_id], callback);
}

module.exports = SplicePoint;
