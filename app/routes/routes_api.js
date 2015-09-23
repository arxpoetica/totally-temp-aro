var models = require('../models');

exports.configure = function(api, middleware) {

  api.use(function(request, response, next) {
    if (process.env.NODE_ENV === 'test') {
      var email = 'test@example.com';
      var password = '#test$';
      models.User.find_by_email(email, function(err, user) {
        if (err) return next(err);
        if (user) {
          request.user = user;
          return next();
        }
        var data = { first_name: 'test', last_name: 'test', email: email, password: password };
        models.User.register(data, function(err, user) {
          if (err) return next(err);
          request.user = user;
          return next();
        });
      });
      return;
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
