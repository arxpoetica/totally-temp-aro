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

var api = express.Router();

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
	User.find_by_id(id, function(err, user) {
		if (err) return callback(err);
		done(err, user || false);
	});
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

app.get('/logout', function(request, response, next) {
	request.logout();
	response.redirect('/login');
})

/******
* API *
*******/

api.use(function(request, response, next) {
	if (process.env.NODE_ENV === 'test') {
		request.user = {
			id: 1,
			first_name: 'test',
			last_name: 'test',
			email: 'test@example.com',
		};
		return next();
	}
	if (!request.user) {
		if (request.xhr) {
			response.status(403);
			return response.json({ error: 'Forbidden' });
		}
		return response.redirect('/login');
	}
	next();
});

// Map view
api.get('/', function(request, response, next) {
	response.render('index.html', {
		env: process.env.NODE_ENV,
		env_is_test: process.env.NODE_ENV === 'test',
		user: request.user,
	})
});

function jsonHandler(response, next) {
	return function(err, data) {
		if (err) return next(err);
		response.json(data || {});
	}
}

// Wirecenters
api.get('/wirecenters/:wirecenter_code', function(request, response, next) {
	var wirecenter_code = request.params.wirecenter_code;
	Wirecenter.find_by_wirecenter_code(wirecenter_code, jsonHandler(response, next));
});

// County Subdivisions
api.get('/county_subdivisions/:statefp', function(request, response, next) {
	var statefp = request.params.statefp;
	CountySubdivision.find_by_statefp(statefp, jsonHandler(response, next));
});

// Census Blocks
api.get('/census_blocks/:statefp/:countyfp', function(request, response, next) {
	var statefp = request.params.statefp;
	var countyfp = request.params.countyfp
	CensusBlock.find_by_statefp_and_countyfp(statefp, countyfp, jsonHandler(response, next));
});

// Locations
api.get('/locations', function(request, response, next) {
	var type = request.query.type;
	Location.find_all(type, jsonHandler(response, next));
});

api.get('/locations/:location_id', function(request, response, next) {
	var location_id = request.params.location_id;
	Location.show_information(location_id, jsonHandler(response, next));
});

api.get('/locations/businesses/:location_id', function(request, response, next) {
	var location_id = request.params.location_id;
	Location.show_businesses(location_id, jsonHandler(response, next));
});

api.post('/locations/create', function(request, response, next) {
	var location_id = request.params.location_id;
	var data = request.body;
	Location.create_location(data, jsonHandler(response, next));
});

api.get('/industries', function(request, response, next) {
	Location.find_industries(jsonHandler(response, next));
});

api.post('/locations/:location_id/update', function(request, response, next) {
	var location_id = request.params.location_id;
	var values = {
		number_of_households: request.body.number_of_households,
	}
	Location.update_households(location_id, values, jsonHandler(response, next));
});

// Network equipment (existing)
api.get('/network/fiber_plant/:carrier_name', function(request, response, next) {
	var carrier_name = request.params.carrier_name;
	Network.view_fiber_plant_for_carrier(carrier_name, jsonHandler(response, next));
});

// Network nodes for user client by node type
api.get('/network/nodes/:node_type', function(request, response, next) {
	var node_type = request.params.node_type;
	Network.view_network_nodes([node_type], null, jsonHandler(response, next));
});

// Network nodes of an existing route
api.get('/network/nodes/:route_id/find', function(request, response, next) {
	var route_id = request.params.route_id;
	var node_types = request.query.node_types ? request.query.node_types.split(',') : null;
	Network.view_network_nodes(node_types, route_id, jsonHandler(response, next));
});

// Edit network nodes in a route
api.post('/network/nodes/:route_id/edit', function(request, response, next) {
	var route_id = request.params.route_id;
	var changes = request.body;
	Network.edit_network_nodes(route_id, changes, jsonHandler(response, next));
});

// Clear network nodes in a route
api.post('/network/nodes/:route_id/clear', function(request, response, next) {
	var route_id = request.params.route_id;
	Network.clear_network_nodes(route_id, jsonHandler(response, next));
});

// Network node types
api.get('/network/nodes', function(request, response, next) {
	Network.view_network_node_types(jsonHandler(response, next));
});

// Route Optimizer
api.get('/route_optimizer/shortest_path/:source_id/:target_ids/:cost_per_meter', function(request, response, next) {
	var source_id = request.params.source_id;
	var target_ids = request.params.target_ids;
	var cost_per_meter = request.params.cost_per_meter;
	NetworkPlan.shortest_path(source_id, target_ids, cost_per_meter, jsonHandler(response, next));
});

// Find all created routes
api.get('/route_optimizer/find_all', function(request, response, next) {
	NetworkPlan.find_all(request.user, jsonHandler(response, next));
});

// Create a new empty route
api.post('/route_optimizer/create', function(request, response, next) {
	var name = request.body.name;
	var area = request.body.area;
	NetworkPlan.create_route(name, area, request.user, jsonHandler(response, next));
});

// Return data of an existing route
api.get('/route_optimizer/:route_id', function(request, response, next) {
	var route_id = request.params.route_id;
	NetworkPlan.find_route(route_id, jsonHandler(response, next));
});

// Return the metadata of an existing route
api.get('/route_optimizer/:route_id/metadata', function(request, response, next) {
	var route_id = request.params.route_id;
	NetworkPlan.find_route(route_id, true, jsonHandler(response, next));
});

// Edits nodes of an existing route
api.post('/route_optimizer/:route_id/edit', function(request, response, next) {
	var route_id = request.params.route_id;
	var changes = request.body;
	NetworkPlan.edit_route(route_id, changes, jsonHandler(response, next));
});

// Edits basic information of an existing route
api.post('/route_optimizer/:route_id/save', function(request, response, next) {
	var route_id = request.params.route_id;
	var changes = request.body;
	NetworkPlan.save_route(route_id, changes, jsonHandler(response, next));
});

// Delete an existing route
api.post('/route_optimizer/:route_id/delete', function(request, response, next) {
	var route_id = request.params.route_id;
	NetworkPlan.delete_route(route_id, jsonHandler(response, next));
});

// Clear an existing route
api.post('/route_optimizer/:route_id/clear', function(request, response, next) {
	var route_id = request.params.route_id;
	NetworkPlan.clear_route(route_id, jsonHandler(response, next));
});

// Export a route as KML
api.get('/route_optimizer/:route_id/:file_name/export', function(request, response, next) {
	var route_id = request.params.route_id;
	var file_name = request.params.file_name;

	NetworkPlan.export_kml(route_id, function(err, kml_output) {
		if (err) return next(err);
		response.attachment(file_name+'.kml');
		response.send(kml_output);
	});
});

// Find users by text
api.get('/user/find', function(request, response, next) {
	var text = request.query.text;
	models.User.find_by_text(text, jsonHandler(response, next));
});

// Share a plan
api.post('/permission/grant', function(request, response, next) {
	var route_id = request.body.route;
	var user_id = request.body.user;
	models.Permission.grant_access(route_id, user_id, 'guest', jsonHandler(response, next));
});

// Create a boundary
api.post('/boundary/:route_id/create', function(request, response, next) {
	var route_id = request.params.route_id;
	var data = request.body;
	models.Boundary.create_boundary(route_id, data, jsonHandler(response, next));
});

// Edit a boundary
api.post('/boundary/:route_id/edit', function(request, response, next) {
	var data = request.body;
	models.Boundary.edit_boundary(data, jsonHandler(response, next));
});

// Find boundaries of a network plan
api.get('/boundary/:route_id/find', function(request, response, next) {
	var route_id = request.params.route_id;
	models.Boundary.find_boundaries(route_id, jsonHandler(response, next));
});

// Market size filters
api.get('/market_size/filters', function(request, response, next) {
	MarketSize.filters(jsonHandler(response, next));
});

// Market size filters
api.get('/market_size/calculate', function(request, response, next) {
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
api.get('/error', function(request, response, next) {
	next(new Error('test'));
});

app.use(api);

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
