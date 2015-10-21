var models = require('../models');
var config = require('../helpers').config;
var _ = require('underscore');

exports.configure = function(api, middleware) {

  var public_config = _.pick(config, 'route_planning', 'ui');

  api.get('/', function(request, response, next) {
    response.render('index.html', {
      env: process.env.NODE_ENV,
      env_is_test: process.env.NODE_ENV === 'test',
      user: request.user,
      config: public_config,
    });
  });

};
