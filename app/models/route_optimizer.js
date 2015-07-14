// Route Optimizer 
//
// The Route Optimizer finds shortest paths between sources and targets

// Empty constructor for now
function RouteOptimizer() {
}

// Find the shortest path between a source and target
//
// 1. database: 'pg' from var pg = require('pg')
// 2. con_string: 'con_string' from var con_string = 'postgres://aro:aro@localhost/aro'
// 3. source: integer. From the 'source' column of aro.graph. This will be the source id of the edge that joins the source location to the graph.
// 4. target: integer. From the 'target' column of aro.graph. This will be the source id of the edge that joins the target location to the graph.
// 3. callback: function to return a GeoJSON object
RouteOptimizer.shortest_path = function(database, con_string, source, targets, cost_per_meter, callback) {
	database.connect(con_string, function(err, client, done) {
		var sql = "SELECT id, edge_length, ST_AsGeoJSON(edge.geom)::json AS geom FROM ";
		sql += "pgr_kdijkstraPath('SELECT id, source::integer, target::integer, edge_length::double precision AS cost FROM client.graph', ";
		sql += "$1, $2, false, false) AS dk ";
		sql += "JOIN client.graph edge ";
		sql += "ON edge.id = dk.id3";

		var target_array = targets.split(',');
		target_array = '{' + target_array.join(',') + '}';

		var query = client.query(sql, [source, target_array]);

		query.on('row', function(row, result){
			result.addRow(row);
		});

		query.on('end', function(result) {
			var features = [];

			for (var i in result.rows) {
				features[i] = {
					'type':'Feature',
					'properties': {
						'length_in_meters': result.rows[i].edge_length
					},
					'geometry': result.rows[i].geom			
				}
			}

			var feature_collection = {
				'type':'FeatureCollection',
				'features': features
			};

			var metadata = {
				'total_cost': total_cost_of_route(feature_collection, cost_per_meter)
			};

			var output = {
				'feature_collection': feature_collection,
				'metadata': metadata
			};

			client.end();
			callback(output);
		});
	});
};

// Get the total CapEx for creating a route
//
// route: GeoJSON FeatureCollection output by the `shortest_path` function above
// cost_per_meter: decimal number. ex. 12.3
function total_cost_of_route(route, cost_per_meter) {
	var lengths = [];

	for (var i in route.features) {
		lengths.push(route.features[i].properties.length_in_meters);
	}

	var total_length = lengths.reduce(function(total, segment_length) { return total + segment_length });

	return total_length * cost_per_meter;
};

module.exports = RouteOptimizer;