// CensusBlock
//
// The County Subdivision is a geographic area used in map layers.

var helpers = require('../helpers');
var database = helpers.database;
var GeoJsonHelper = helpers.GeoJsonHelper;
var txain = require('txain');

var CensusBlock = {};

CensusBlock.find_by_statefp_and_countyfp = function(statefp, countyfp, viewport, callback) {
	txain(function(callback) {
		if (viewport.zoom > viewport.threshold) {
			var sql = `
				SELECT gid as id, name, ST_AsGeoJSON(ST_Simplify(geom, $4))::json AS geom FROM aro.census_blocks
				WHERE statefp = $1 AND countyfp = $2
				AND ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($3)), 4326), geom)
			`
			var params = [statefp, countyfp, viewport.linestring, viewport.simplify_factor];
		} else {
			var sql = `
				SELECT ST_AsGeoJSON(ST_Simplify(ST_Union(geom), $4))::json AS geom FROM aro.census_blocks
				WHERE statefp = $1 AND countyfp = $2
				AND ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($3)), 4326), geom)
			`
			var params = [statefp, countyfp, viewport.linestring, viewport.simplify_factor];
		}
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
				'features': features,
			},
		};
		callback(null, output);
	})
	.end(callback)
};

module.exports = CensusBlock;
