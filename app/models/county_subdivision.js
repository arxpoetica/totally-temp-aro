// CountySubdivision 
//
// The County Subdivision is a geographic area used in map layers.

var GeoJsonHelper = require('../helpers/geojson_helper.js');

// Empty constructor for now
function CountySubdivision() {
}

// Find all County Subdivisions in a US state by querying the `statefp` field
//
// 1. database: 'pg' from var pg = require('pg')
// 2. con_string: 'con_string' from var con_string = 'postgres://aro:aro@localhost/aro'
// 3. statefp: String. ex. '36' is New York state
// 4. callback: function to return a GeoJSON object
CountySubdivision.find_by_statefp = function(database, con_string, statefp, callback) {
	database.connect(con_string, function(err, client, done) {
		var sql = "SELECT ST_AsGeoJSON(geom)::json AS geom FROM aro.cousub WHERE statefp = $1";
		var query = client.query(sql, [statefp]);

		query.on('row', function(row, result){
			result.addRow(row);
		});

		query.on('end', function(result) {
			var properties = {'color': 'green'}
			var out = GeoJsonHelper.build_feature_collection(result.rows, properties);
			client.end();
			callback(out);
		});
	});
};

module.exports = CountySubdivision;