var models = require('../models');

exports.configure = function(api, middleware) {

  api.use(function(request, response, next) {
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
