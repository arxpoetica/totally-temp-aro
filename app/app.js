var express = require('express');
var app = express();
var compression = require('compression');
var path = require('path');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var passport = require('passport');

var port = process.env.PORT || 8000
app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(require('cookie-session')({
	name: 'session',
	keys: ['key1', 'key2'],
}));
app.use(require('express-flash')());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));
app.set('views', './views');
app.engine('html', ejs.renderFile);

// Models
var models = require('./models');
var CountySubdivision = models.CountySubdivision;
var CensusBlock = models.CensusBlock;
var Location = models.Location;
var Network = models.Network;
var NetworkPlan = models.NetworkPlan;
var Wirecenter = models.Wirecenter;
var MarketSize = models.MarketSize;
var User = models.User;

var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	},
	function(email, password, callback) {
		User.login(email, password, function(err, user) {
			if (err && !require('node-errors').isCustomError(err)) return callback(err)
			if (err) return callback(null, false, { message: err.message })
			return callback(err, user);
		});
	}
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.find_by_id(id, done);
});

app.get('/login', function(request, response, next) {
	response.render('login.html', {
		error: request.flash('error'),
	});
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);

/********
* VIEWS *
*********/

// Map view
app.get('/', function(request, response, next) {
	response.render('index.html', {
		env: process.env.NODE_ENV,
		env_is_test: process.env.NODE_ENV === 'test',
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

// Network nodes for user client by node type
app.get('/network/nodes/:node_type', function(request, response, next) {
	var node_type = request.params.node_type;
	Network.view_network_nodes(node_type, null, jsonHandler(response, next));
});

// Network nodes of an existing route
app.get('/network/nodes/:route_id/find', function(request, response, next) {
	var route_id = request.params.route_id;
	Network.view_network_nodes(null, route_id, jsonHandler(response, next));
});

// Edit network nodes in a route
app.post('/network/nodes/:route_id/edit', function(request, response, next) {
	var route_id = request.params.route_id;
	var changes = request.body;
	Network.edit_network_nodes(route_id, changes, jsonHandler(response, next));
});

// Clear network nodes in a route
app.post('/network/nodes/:route_id/clear', function(request, response, next) {
	var route_id = request.params.route_id;
	Network.clear_network_nodes(route_id, jsonHandler(response, next));
});

// Network node types
app.get('/network/nodes', function(request, response, next) {
	Network.view_network_node_types(jsonHandler(response, next));
});

// Route Optimizer
app.get('/route_optimizer/shortest_path/:source_id/:target_ids/:cost_per_meter', function(request, response, next) {
	var source_id = request.params.source_id;
	var target_ids = request.params.target_ids;
	var cost_per_meter = request.params.cost_per_meter;
	NetworkPlan.shortest_path(source_id, target_ids, cost_per_meter, jsonHandler(response, next));
});

// Find all created routes
app.get('/route_optimizer/find_all', function(request, response, next) {
	NetworkPlan.find_all(jsonHandler(response, next));
});

// Create a new empty route
app.post('/route_optimizer/create', function(request, response, next) {
	var name = request.body.name;
	var area = request.body.area;
	NetworkPlan.create_route(name, area, jsonHandler(response, next));
});

// Return data of an existing route
app.get('/route_optimizer/:route_id', function(request, response, next) {
	var route_id = request.params.route_id;
	NetworkPlan.find_route(route_id, jsonHandler(response, next));
});

// Return the metadata of an existing route
app.get('/route_optimizer/:route_id/metadata', function(request, response, next) {
	var route_id = request.params.route_id;
	NetworkPlan.find_route(route_id, true, jsonHandler(response, next));
});

// Edits nodes of an existing route
app.post('/route_optimizer/:route_id/edit', function(request, response, next) {
	var route_id = request.params.route_id;
	var changes = request.body;
	NetworkPlan.edit_route(route_id, changes, jsonHandler(response, next));
});

// Edits basic information of an existing route
app.post('/route_optimizer/:route_id/save', function(request, response, next) {
	var route_id = request.params.route_id;
	var changes = request.body;
	NetworkPlan.save_route(route_id, changes, jsonHandler(response, next));
});

// Delete an existing route
app.post('/route_optimizer/:route_id/delete', function(request, response, next) {
	var route_id = request.params.route_id;
	NetworkPlan.delete_route(route_id, jsonHandler(response, next));
});

// Clear an existing route
app.post('/route_optimizer/:route_id/clear', function(request, response, next) {
	var route_id = request.params.route_id;
	NetworkPlan.clear_route(route_id, jsonHandler(response, next));
});

// Export a route as KML
app.get('/route_optimizer/:route_id/:file_name/export', function(request, response, next) {
	var route_id = request.params.route_id;
	var file_name = request.params.file_name;

	NetworkPlan.export_kml(route_id, function(err, kml_output) {
		if (err) return next(err);
		response.attachment(file_name+'.kml');
		response.send(kml_output);
	});
});

// Market size filters
app.get('/market_size/filters', function(request, response, next) {
	MarketSize.filters(jsonHandler(response, next));
});

// Market size filters
app.get('/market_size/calculate', function(request, response, next) {
	var geo_json = request.query.geo_json;
	var threshold = request.query.threshold;
	var filters = {
		industry: request.query.industry,
		employees_range: request.query.employees_range,
		product: request.query.product,
	}
	MarketSize.calculate(geo_json, threshold, filters, jsonHandler(response, next));
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
