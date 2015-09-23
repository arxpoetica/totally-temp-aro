var ejs = require('ejs');
var path = require('path');
var express = require('express');
var passport = require('passport');
var bodyParser = require('body-parser');
var compression = require('compression');

var app = express();
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

var middleware = require('./middleware');

require('./routes/routes_authentication').configure(app, middleware);
require('./routes/routes_errors').configure(app, middleware);

var api = express.Router();
var routes = [
	'api',
	'user',
	'map',
	'permission',
	'wirecenter',
	'county_subdivision',
	'census_block',
	'location',
	'network',
	'boundary',
	'market_size',
	'network_plan',
];
routes.forEach(function(route) {
	require('./routes/routes_'+route).configure(api, middleware);
});
app.use(api);

module.exports = app;

if (module.id === require.main.id) {
	var port = process.env.PORT || 8000;
	app.listen(port);
}
