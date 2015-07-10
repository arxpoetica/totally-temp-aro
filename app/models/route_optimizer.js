// Location 
//
// A Location is a point in space which can contain other objects such as businesses and households

var GeoJsonHelper = require('../helpers/geojson_helper.js');

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
RouteOptimizer.shortest_path = function(database, con_string, source, target, callback) {
	database.connect(con_string, function(err, client, done) {
		var sql = "SELECT id, ST_AsGeoJSON(edge.geom)::json AS geom FROM ";
		sql += "pgr_dijkstra('SELECT id, source::integer, target::integer, edge_length::double precision AS cost FROM client.graph', ";
		sql += "$1, $2, false, false) AS dk ";
		sql += "JOIN client.graph edge ";
		sql += "ON edge.id = dk.id2";
		var query = client.query(sql, [source, target]);

		query.on('row', function(row, result){
			result.addRow(row);
		});

		query.on('end', function(result) {
			var properties = {'color': 'red'};
			var out = GeoJsonHelper.build_feature_collection(result.rows, properties);
			client.end();
			callback(out);
		});
	});
};

module.exports = RouteOptimizer;