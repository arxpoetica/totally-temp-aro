var models = require('../models');
var nook = require('node-errors').nook;

exports.configure = function(app, middleware) {

  var jsonHandler = middleware.jsonHandler;

  app.get('/settings/show', function(request, response, next) {
    response.render('settings.html', {
      user: request.user,
      error: request.flash('error'),
      success: request.flash('success'),
    });
  });

  app.post('/settings/change_password', function(request, response, next) {
    var user = request.user;
    var old_password = request.body.old_password;
    var password = request.body.password;
    var password_confirm = request.body.password_confirm;

    if (password !== password_confirm) {
      request.flash('error', 'Passwords do not match');
      return response.redirect('/settings/show');
    }

    models.User.change_password(user.id, old_password, password, function(err) {
      if (err) {
        request.flash('error', err.message);
      } else {
        request.flash('success', 'Password changed successfully');
      }
      return response.redirect('/settings/show');
    })
  });

};
