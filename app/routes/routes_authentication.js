var models = require('../models');
var passport = require('passport');
var querystring = require('querystring');
var nook = require('node-errors').nook;

exports.configure = function(app, middleware) {

  var jsonHandler = middleware.jsonHandler;

  var LocalStrategy = require('passport-local').Strategy;

  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, callback) {
      models.User.login(email, password, function(err, user) {
        if (err && !require('node-errors').isCustomError(err)) return callback(err)
        if (err) return callback(null, false, { message: err.message })
        return callback(err, user);
      });
    }
  ));

  passport.serializeUser(function(user, callback) {
    callback(null, user.id);
  });

  passport.deserializeUser(function(id, callback) {
    models.User.find_by_id(id, nook(callback, function(user) {
      callback(null, user || false);
    }));
  });

  app.get('/login', function(request, response, next) {
    response.render('login.html', {
      error: request.flash('error'),
      info: request.flash('info'),
      success: request.flash('success'),
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
  });

  app.get('/forgot_password', function(request, response, next) {
    response.render('forgot_password.html', {
      error: request.flash('error'),
    });
  });

  app.post('/forgot_password', function(request, response, next) {
    var email = request.body.email;
    models.User.forgot_password(email, function(err) {
      if (err) {
        request.flash('error', err.message);
        response.redirect('/forgot_password');
      } else {
        request.flash('info', 'We just sent reset instructions to your email address');
        response.redirect('/login');
      }
    });
  });

  app.get('/reset_password', function(request, response, next) {
    var code = request.query.code;
    response.render('reset_password.html', {
      error: request.flash('error'),
      code: code,
    });
  });

  app.post('/reset_password', function(request, response, next) {
    var code = request.body.code;
    var password = request.body.password;
    var repassword = request.body.repassword;

    if (password !== repassword) {
      request.flash('error', 'Passwords do not match');
      return response.redirect('/reset_password?'+querystring.stringify({ code: code }));
    }

    models.User.reset_password(code, password, function(err) {
      if (err) {
        request.flash('error', err.message);
        response.redirect('/reset_password?'+querystring.stringify({ code: code }));
      } else {
        request.flash('success', 'Password changed successfully. Now you can log in');
        response.redirect('/login');
      }
    });
  });

};
