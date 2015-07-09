// SplicePoint 
//
// The Splice Point is a point on the carrier's network from which fiber may be extended.

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
		var sql = "SELECT id, ST_AsGeoJSON(geom)::json AS geom FROM aro.splice_points WHERE carrier_name = $1";
		var query = client.query(sql, [carrier_name]);

		query.on('row', function(row, result){
			result.addRow(row);
		});

		query.on('end', function(result) {
			var features = [];

			for (var i in result.rows) {
				features[i] = {
					'type':'Feature',
					'properties': {
						'icon': icon,
						'id': result.rows[i].id
					},
					'geometry': result.rows[i].geom			
				}
			}

			var out = {
				'type':'FeatureCollection',
				'features': features
			};

			client.end();
			callback(out);
		});
	});
};

// Get the closest vertex to a Splice Point.
// This is used when selecting a splice point to be the source in a route plan, since it overlaps with a vertex
//
// 1. database: 'pg' from var pg = require('pg')
// 2. con_string: 'con_string' from var con_string = 'postgres://aro:aro@localhost/aro'
// 3. splice_point_id: integer. ex. 1738
// 4. callback: function to return a GeoJSON object
SplicePoint.get_closest_vertex = function(database, con_string, splice_point_id, callback) {
	database.connect(con_string, function(err, client, done) {
		var sql = "SELECT vertex.id AS vertex_id FROM client.graph_vertices_pgr AS vertex ";
		sql += "JOIN aro.splice_points splice_points ";
		sql += "ON splice_points.geom = vertex.the_geom ";
		sql += "WHERE splice_points.id = $1";
		var query = client.query(sql, [splice_point_id]);

		query.on('row', function(row, result) {
			result.addRow(row)
		});

		query.on('end', function(result) {
			client.end();
			callback(result.rows[0]);
		});
	});
}

module.exports = SplicePoint;