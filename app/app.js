var express = require('express');
var app = express();
var compression = require('compression');
var path = require('path');
var bodyParser = require('body-parser');

var port = process.env.PORT || 8000
app.use(compression());
app.use(bodyParser.json());
app.use(express.static('public'));

// Models
var models = require('./models')
var CountySubdivision = models.CountySubdivision;
var Location = models.Location;
var SplicePoint = models.SplicePoint;
var RouteOptimizer = models.RouteOptimizer;

/********
* VIEWS *
*********/

// Map view
app.get('/', function(request, response, next) {
	response.sendFile(path.join(__dirname, './views/index.html'));
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
app.get('/wirecenters', function(request, response, next) {
	models.Wirecenter.find_all(jsonHandler(response, next));
});

// County Subdivisions
app.get('/county_subdivisions/:statefp', function(request, response, next) {
	var statefp = request.params.statefp;
	CountySubdivision.find_by_statefp(statefp, jsonHandler(response, next));
});

// Existing equipment
app.get('/equipment/:carrier_name', function(request, response, next) {
	var carrier_name = request.params.carrier_name;
	models.Equipment.find_by_carrier(carrier_name, jsonHandler(response, next));
});

// Locations
app.get('/locations', function(request, response, next) {
	Location.find_all(jsonHandler(response, next));
});

app.get('/locations/closest_vertex/:location_id', function(request, response, next) {
	var location_id = request.params.location_id;
	Location.get_closest_vertex(location_id, jsonHandler(response, next));
});

app.get('/locations/house_hold_summary/:location_id', function(request, response, next) {
	var location_id = request.params.location_id;
	Location.get_house_hold_summary(location_id, jsonHandler(response, next));
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

app.post('/locations/update/:location_id', function(request, response, next) {
	var location_id = request.params.location_id;
	var values = {
		number_of_households: request.body.number_of_households,
	}
	Location.update_house_hold_summary(location_id, values, jsonHandler(response, next));
});

// Splice Points
app.get('/splice_points/:carrier_name', function(request, response, next) {
	var carrier_name = request.params.carrier_name;
	SplicePoint.find_by_carrier(carrier_name, jsonHandler(response, next));
});

app.get('/splice_points/closest_vertex/:splice_point_id', function(request, response, next) {
	var splice_point_id = request.params.splice_point_id;
	SplicePoint.get_closest_vertex(splice_point_id, jsonHandler(response, next));
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
