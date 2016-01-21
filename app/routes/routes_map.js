var models = require('../models');
var helpers = require('../helpers');
var config = helpers.config;
var database = helpers.database;
var _ = require('underscore');

exports.configure = function(api, middleware) {

  var public_config = _.pick(config,
    'route_planning',
    'ui',
    'currency_symbol',
    'client_carrier_name',
    'displayable_client_carrier_name');

  api.get('/', function(request, response, next) {
    database.query('SELECT * FROM cities ORDER BY city_name ASC', function(err, cities) {
      if (err) return next(err);

      response.render('index.html', {
        env: process.env.NODE_ENV,
        env_is_production: process.env.NODE_ENV === 'production',
        env_is_test: process.env.NODE_ENV === 'test',
        user: request.user,
        config: public_config,
        cities: cities,
      });
    })
  });

};
