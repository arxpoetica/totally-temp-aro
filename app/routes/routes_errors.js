var models = require('../models');

exports.configure = function(app, middleware) {

  // For testing the error handler
  app.get('/error', function(request, response, next) {
    next(new Error('test'));
  });

  // error handler
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({
      error: err.message,
    });
  });

};
