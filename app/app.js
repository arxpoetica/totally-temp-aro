var express = require('express');
var app = express();
var compression = require('compression');
app.use(compression());
app.listen(8000);

// Database TODO: config file for databases
var pg = require('pg');
var con_string = 'postgres://aro:aro@localhost/aro';


// Models
var CountySubdivision = require('./models/county_subdivision.js');
var RoadSegment = require('./models/road_segment.js');

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

// Road Segments
app.get('/road_segments/:countyfp', function(request, response) {
	RoadSegment.find_by_countyfp(pg, con_string, request.params.countyfp, function(data) {
		response.send(data);
	});
});