var models = require('../models');
var passport = require('passport');

exports.configure = function(app, middleware) {

  var jsonHandler = middleware.jsonHandler;

  var LocalStrategy = require('passport-local').Strategy;

  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, callback) {
      User.login(email, password, function(err, user) {
        if (err && !require('node-errors').isCustomError(err)) return callback(err)
        if (err) return callback(null, false, { message: err.message })
        return callback(err, user);
      });
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    models.User.find_by_id(id, function(err, user) {
      if (err) return callback(err);
      done(err, user || false);
    });
  });

  app.get('/login', function(request, response, next) {
    response.render('login.html', {
      error: request.flash('error'),
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

};
