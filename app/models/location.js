// Location 
//
// A Location is a point in space which can contain other objects such as businesses and households

var GeoJsonHelper = require('../helpers/geojson_helper.js');

// Empty constructor for now
function Location() {
}

// Find all Locations
//
// 1. database: 'pg' from var pg = require('pg')
// 2. con_string: 'con_string' from var con_string = 'postgres://aro:aro@localhost/aro'
// 3. callback: function to return a GeoJSON object
Location.find_all = function(database, con_string, callback) {
	database.connect(con_string, function(err, client, done) {
		var sql = "SELECT ST_AsGeoJSON(geog)::json AS geom FROM aro.locations";
		var query = client.query(sql);

		query.on('row', function(row, result){
			result.addRow(row);
		});

		query.on('end', function(result) {
			var properties = {'color': 'red'}
			var out = GeoJsonHelper.build_feature_collection(result.rows, properties);
			client.end();
			callback(out);
		});
	});
};

module.exports = Location;