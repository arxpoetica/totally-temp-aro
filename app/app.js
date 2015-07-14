var express = require('express');
var app = express();
var compression = require('compression');
app.use(compression());
app.listen(8000);
app.use(express.static('public'));

// Database TODO: config file for databases
var pg = require('pg');
var con_string = 'postgres://aro:aro@localhost/aro';


// Models
var CountySubdivision = require('./models/county_subdivision.js');
var Location = require('./models/location.js');
var SplicePoint = require('./models/splice_point.js');
var RouteOptimizer = require('./models/route_optimizer.js');

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
app.get('/county_subdivisions/:statefp', function(request, response) {
	CountySubdivision.find_by_statefp(pg, con_string, request.params.statefp, function(data) {
		response.send(data);
	});
});

// Locations
app.get('/locations', function(request, response) {
	Location.find_all(pg, con_string, function(data) {
		response.send(data);
	});
});

app.get('/locations/closest_vertex/:location_id', function(request, response) {
	Location.get_closest_vertex(pg, con_string, request.params.location_id, function(data) {
		response.json(data);
	});
});

// Splice Points
app.get('/splice_points/:carrier_name', function(request, response) {
	SplicePoint.find_by_carrier(pg, con_string, request.params.carrier_name, function(data) {
		response.send(data);
	});
});

app.get('/splice_points/closest_vertex/:splice_point_id', function(request, response) {
	SplicePoint.get_closest_vertex(pg, con_string, request.params.splice_point_id, function(data) {
		response.json(data);
	});
});

// Route Optimizer
app.get('/route_optimizer/shortest_path/:source_id/:target_ids/:cost_per_meter', function(request, response) {
	RouteOptimizer.shortest_path(pg, con_string, request.params.source_id, request.params.target_ids, request.params.cost_per_meter, function(data) {
		response.send(data);
	});
});