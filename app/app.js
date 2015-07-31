var express = require('express');
var app = express();
var compression = require('compression');
var path = require('path');
var bodyParser = require('body-parser');
var ejs = require('ejs');

var port = process.env.PORT || 8000
app.use(compression());
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('views', './views');
app.engine('html', ejs.renderFile);

// Models
var models = require('./models');
var CountySubdivision = models.CountySubdivision;
var CensusBlock = models.CensusBlock;
var Location = models.Location;
var Network = models.Network;
var SplicePoint = models.SplicePoint;
var RouteOptimizer = models.RouteOptimizer;
var Wirecenter = models.Wirecenter;

/********
* VIEWS *
*********/

// Map view
app.get('/', function(request, response, next) {
	response.render('index.html', {
		env: process.env.NODE_ENV,
		show_on_test: process.env.NODE_ENV === 'test' ? '' : 'hidden',
	})
});

/******
* API *
*******/

function jsonHandler(response, next) {
	return function(err, data) {
		if (err) return next(err);
		response.json(data || {});
	}
}

// Wirecenters
app.get('/wirecenters/:wirecenter_code', function(request, response, next) {
	var wirecenter_code = request.params.wirecenter_code;
	Wirecenter.find_by_wirecenter_code(wirecenter_code, jsonHandler(response, next));
});

// County Subdivisions
app.get('/county_subdivisions/:statefp', function(request, response, next) {
	var statefp = request.params.statefp;
	CountySubdivision.find_by_statefp(statefp, jsonHandler(response, next));
});

// Census Blocks
app.get('/census_blocks/:statefp/:countyfp', function(request, response, next) {
	var statefp = request.params.statefp;
	var countyfp = request.params.countyfp
	CensusBlock.find_by_statefp_and_countyfp(statefp, countyfp, jsonHandler(response, next));
});

// Locations
app.get('/locations', function(request, response, next) {
	Location.find_all(jsonHandler(response, next));
});

app.get('/locations/:location_id', function(request, response, next) {
	var location_id = request.params.location_id;
	Location.show_information(location_id, jsonHandler(response, next));
});

app.get('/locations/businesses/:location_id', function(request, response, next) {
	var location_id = request.params.location_id;
	Location.show_businesses(location_id, jsonHandler(response, next));
});

app.post('/locations/create/', function(request, response, next) {
	var location_id = request.params.location_id;
	var data = request.body
	Location.create_location(data, jsonHandler(response, next));
});

app.post('/locations/:location_id/update', function(request, response, next) {
	var location_id = request.params.location_id;
	var values = {
		number_of_households: request.body.number_of_households,
	}
	Location.update_households(location_id, values, jsonHandler(response, next));
});

// Network equipment (existing)
app.get('/network/fiber_plant/:carrier_name', function(request, response, next) {
	var carrier_name = request.params.carrier_name;
	Network.view_fiber_plant_for_carrier(carrier_name, jsonHandler(response, next));
});

// Splice Points
app.get('/splice_points/:carrier_name', function(request, response, next) {
	var carrier_name = request.params.carrier_name;
	SplicePoint.find_by_carrier(carrier_name, jsonHandler(response, next));
});

// Route Optimizer
app.get('/route_optimizer/shortest_path/:source_id/:target_ids/:cost_per_meter', function(request, response, next) {
	var source_id = request.params.source_id;
	var target_ids = request.params.target_ids;
	var cost_per_meter = request.params.cost_per_meter;
	RouteOptimizer.shortest_path(source_id, target_ids, cost_per_meter, jsonHandler(response, next));
});

// Find all created routes
app.get('/route_optimizer/find_all', function(request, response, next) {
	RouteOptimizer.find_all(jsonHandler(response, next));
});

// Create a new empty route
app.post('/route_optimizer/create', function(request, response, next) {
	RouteOptimizer.create_route(jsonHandler(response, next));
});

// Return data of an existing route
app.get('/route_optimizer/:route_id', function(request, response, next) {
	var route_id = request.params.route_id;
	RouteOptimizer.find_route(route_id, jsonHandler(response, next));
});

// Edits nodes of an existing route
app.post('/route_optimizer/:route_id/edit', function(request, response, next) {
	var route_id = request.params.route_id;
	var changes = request.body;
	RouteOptimizer.edit_route(route_id, changes, jsonHandler(response, next));
});

// Edits basic information of an existing route
app.post('/route_optimizer/:route_id/save', function(request, response, next) {
	var route_id = request.params.route_id;
	var changes = request.body;
	RouteOptimizer.save_route(route_id, changes, jsonHandler(response, next));
});

// Delete an existing route
app.post('/route_optimizer/:route_id/delete', function(request, response, next) {
	var route_id = request.params.route_id;
	RouteOptimizer.delete_route(route_id, jsonHandler(response, next));
});

// Clear an existing route
app.post('/route_optimizer/:route_id/clear', function(request, response, next) {
	var route_id = request.params.route_id;
	RouteOptimizer.clear_route(route_id, jsonHandler(response, next));
});

// For testing the error handler
app.get('/error', function(request, response, next) {
	next(new Error('test'))
});

// 404 for any URL that doesn't match the previous ones
app.all('*', function(request, response, next) {
	response.status(404).json({
		error: 'Not found',
	})
});

// error handler
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({
  	error: err.message,
  });
});

app.listen(port);
