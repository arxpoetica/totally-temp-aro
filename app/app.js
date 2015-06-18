var express = require('express');
var app = express();
var compression = require('compression');
app.use(compression());
app.listen(8000);

var pg = require('pg');
var con = 'postgres://aro:aro@localhost/aro';
var client = new pg.Client(con);
client.connect();

/********
* VIEWS *
*********/

// Map view
app.get('/', function(request, response){
	response.sendfile('./views/index.html');
});

/******
* API *
*******/

// County Subdivisions
app.get('/county_subdivisions/:state_id', function(request, response) {
	var sql = "SELECT ST_AsGeoJSON(geom)::json AS geom, name FROM aro_cousub WHERE statefp = $1";

	var query = client.query(sql, [request.params.state_id]);

	query.on('row', function(row, result){
		result.addRow(row);
	});
	
	query.on('end', function(result) {
		features = [];
		for (var i in result.rows) {
			features[i] = {
				'type':'Feature',
				'properties': {
					'color':'green',
					'name': result.rows[i].name
				},
				'geometry': result.rows[i].geom			
			}
		}

		var out = {
			'type':'FeatureCollection',
			'features': features
		};

		response.send(out);
	});
});