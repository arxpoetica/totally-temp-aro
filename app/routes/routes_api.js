var models = require('../models');

exports.configure = function(api, middleware) {

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

};
