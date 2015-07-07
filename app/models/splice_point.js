// SplicePoint 
//
// The Splice Point is a point on the carrier's network from which fiber may be extended.

var GeoJsonHelper = require('../helpers/geojson_helper.js');
var icon = 'splice_point.png'

// Empty constructor for now
function SplicePoint() {
}

// Find all Splice Points for a given carrier
//
// 1. database: 'pg' from var pg = require('pg')
// 2. con_string: 'con_string' from var con_string = 'postgres://aro:aro@localhost/aro'
// 3. carrier_name: String. ex. 'VERIZON'
// 4. callback: function to return a GeoJSON object
SplicePoint.find_by_carrier = function(database, con_string, carrier_name, callback) {
	database.connect(con_string, function(err, client, done) {
		var sql = "SELECT ST_AsGeoJSON(geom)::json AS geom FROM aro.splice_points WHERE carrier_name = $1";
		var query = client.query(sql, [carrier_name]);

		query.on('row', function(row, result){
			result.addRow(row);
		});

		query.on('end', function(result) {
			var properties = {'icon': icon}
			var out = GeoJsonHelper.build_feature_collection(result.rows, properties);
			client.end();
			callback(out);
		});
	});
};

module.exports = SplicePoint;