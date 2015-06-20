// RoadSegment 
//
// Road Segments that are used on the map layer are currently stored in the `aro_edges` table. 

var GeoJsonHelper = require('../helpers/geojson_helper.js');

// Empty constructor for now
function RoadSegment() {
}

// Find all Road Segments in a county by querying the `countyfp` field
//
// 1. database: 'pg' from var pg = require('pg')
// 2. con_string: 'con_string' from var con_string = 'postgres://aro:aro@localhost/aro'
// 3. countyfp: String. ex. '047' is Kings county, New York (Brooklyn)
// 4. callback: function to return a GeoJSON object
RoadSegment.find_by_countyfp = function(database, con_string, countyfp, callback) {
	database.connect(con_string, function(err, client, done) {
		var sql = 'SELECT ST_AsGeoJSON(geom)::json AS geom FROM aro_edges WHERE countyfp = $1';
		var query = client.query(sql, [countyfp]);

		query.on('row', function(row, result){
			result.addRow(row);
		});

		query.on('end', function(result) {
			var properties = {'color': 'red'}
			var out = GeoJsonHelper.build_feature_collection(result, properties);
			client.end();
			callback(out);
		});
	});
}

module.exports = RoadSegment;