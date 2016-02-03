// CountySubdivision
//
// The County Subdivision is a geographic area used in map layers.

var helpers = require('../helpers');
var database = helpers.database;
var GeoJsonHelper = helpers.GeoJsonHelper;
var txain = require('txain');

var CountySubdivision = {};

// Find all County Subdivisions in a US state by querying the `statefp` field
//
// 1. statefp: String. ex. '36' is New York state
// 2. callback: function to return a GeoJSON object
CountySubdivision.find_by_statefp = function(statefp, viewport, callback) {
	var sql = `
		SELECT gid AS id, name, ST_AsGeoJSON(ST_Simplify(geom, $3))::json AS geom FROM aro.cousub
		WHERE statefp = $1
		AND ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($2)), 4326), geom)
	`
	var params = [statefp, viewport.linestring, viewport.simplify_factor];

	txain(function(callback) {
	  database.query(sql, params, callback);
	})
	.then(function(rows, callback) {
		var features = rows.map(row => ({
			'type': 'Feature',
			'properties': {
				'id': row.id,
				'name': row.name,
			},
			'geometry': row.geom,
		}));

		var output = {
			'feature_collection': {
				'type':'FeatureCollection',
				'features': features
			},
		};
		callback(null, output);
	})
	.end(callback);
};

module.exports = CountySubdivision;
