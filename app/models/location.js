// Location 
//
// A Location is a point in space which can contain other objects such as businesses and households

var icon = 'location_business_gray.png'

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
		var sql = "SELECT id, ST_AsGeoJSON(geog)::json AS geom FROM aro.locations";
		var query = client.query(sql);

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

			var feature_collection = {
				'type':'FeatureCollection',
				'features': features
			};

			var output = {
				'feature_collection': feature_collection
			};

			client.end();
			callback(output);
		});
	});
};

// Get the closest vertex to a Location.
// This is used when selecting a Location to be the target in a route plan, since it overlaps with a vertex
//
// 1. database: 'pg' from var pg = require('pg')
// 2. con_string: 'con_string' from var con_string = 'postgres://aro:aro@localhost/aro'
// 3. location_id: integer. ex. 1738
// 4. callback: function to return a GeoJSON object
Location.get_closest_vertex = function(database, con_string, location_id, callback) {
	database.connect(con_string, function(err, client, done) {
		var sql = "SELECT vertex.id AS vertex_id FROM client.graph_vertices_pgr AS vertex ";
		sql += "JOIN aro.locations locations ";
		sql += "ON locations.geom && vertex.the_geom ";
		sql += "WHERE locations.id = $1";
		var query = client.query(sql, [location_id]);

		query.on('row', function(row, result) {
			result.addRow(row)
		});

		query.on('end', function(result) {
			client.end();
			callback(result.rows[0]);
		});
	});
}

Location.total_service_cost = function(database, con_string, location_id, callback) {
	database.connect(con_string, function(err, client, done) {
		var sql = "SELECT locations.entry_fee, sum(businesses.install_cost) total_install_costs ";
		sql += "FROM aro.locations locations ";
		sql += "JOIN aro.businesses businesses ";
		sql += "ON businesses.location_id = $1 ";
		sql += "GROUP BY locations.entry_fee";

		var query = client.query(sql, [location_id]);

		query.on('row', function(row, result) {
			result.addRow(row);
		});

		query.on('end', function(result) {
			client.end();
			callback(result.rows[0]);
		});
	});
}

module.exports = Location;