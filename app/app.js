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
var Location = require('./models/location.js');

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