var models = require('../models');

exports.configure = function(api, middleware) {

  api.get('/', function(request, response, next) {
    response.render('index.html', {
      env: process.env.NODE_ENV,
      env_is_test: process.env.NODE_ENV === 'test',
      user: request.user,
    });
  });

};
