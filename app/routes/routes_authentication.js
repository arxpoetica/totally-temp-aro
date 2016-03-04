var models = require('../models')
var passport = require('passport')
var querystring = require('querystring')

exports.configure = (app, middleware) => {
  var LocalStrategy = require('passport-local').Strategy

  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  (email, password, callback) => {
    models.User.login(email, password)
      .then((user) => callback(null, user))
      .catch((err) => {
        if (!require('node-errors').isCustomError(err)) return callback(err)
        return callback(null, false, { message: err.message })
      })
  }))

  passport.serializeUser((user, callback) => {
    callback(null, user.id)
  })

  passport.deserializeUser((id, callback) => {
    models.User.find_by_id(id)
      .then((user) => callback(null, user))
      .catch(callback)
  })

  app.get('/login', (request, response, next) => {
    response.render('login.html', {
      error: request.flash('error'),
      info: request.flash('info'),
      success: request.flash('success')
    })
  })

  app.post('/login',
    passport.authenticate('local', { successRedirect: '/',
                                     failureRedirect: '/login',
                                     failureFlash: true })
  )

  app.get('/logout', (request, response, next) => {
    request.logout()
    response.redirect('/login')
  })

  app.get('/forgot_password', (request, response, next) => {
    response.render('forgot_password.html', {
      error: request.flash('error')
    })
  })

  app.post('/forgot_password', (request, response, next) => {
    var email = request.body.email
    models.User.forgot_password(email)
      .then(() => {
        request.flash('info', 'We just sent reset instructions to your email address')
        response.redirect('/login')
      })
      .catch((err) => {
        request.flash('error', err.message)
        response.redirect('/forgot_password')
      })
  })

  app.get('/reset_password', (request, response, next) => {
    var code = request.query.code
    response.render('reset_password.html', {
      error: request.flash('error'),
      code: code
    })
  })

  app.post('/reset_password', (request, response, next) => {
    var code = request.body.code
    var password = request.body.password
    var repassword = request.body.repassword

    if (password !== repassword) {
      request.flash('error', 'Passwords do not match')
      return response.redirect('/reset_password?' + querystring.stringify({ code: code }))
    }

    models.User.reset_password(code, password)
      .then(() => {
        request.flash('success', 'Password changed successfully. Now you can log in')
        response.redirect('/login')
      })
      .catch((err) => {
        request.flash('error', err.message)
        response.redirect('/reset_password?' + querystring.stringify({ code: code }))
      })
  })
}
