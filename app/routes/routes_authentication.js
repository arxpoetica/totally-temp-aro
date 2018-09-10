var models = require('../models')
var helpers = require('../helpers')
var passport = require('passport')
var querystring = require('querystring')
var public_config = helpers.public_config
var config = helpers.config
const authenticationConfigPromise = models.Authentication.getConfig('ldap')

exports.configure = (app, middleware) => {
  var LocalStrategy = require('passport-local').Strategy
  var mapUserIdToProjectId = {}

  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  (email, password, callback) => {
    authenticationConfigPromise
      .then((authenticationConfig) => {
        if (authenticationConfig.enabled) {
          console.log(`Attempting LDAP login for user ${email}`)
          models.User.loginLDAP(email, password)
            .then((user) => {
              console.log(`Successfully logged in user ${email} with LDAP`)
              console.log(user)
              return callback(null, user)
            })
            .catch((err) => {
              console.warn(`LDAP login failed for user ${email}. Trying local login`)
              models.User.login(email, password)
                .then((user) => { 
                  console.log(`Logged in user ${email} with local cached login (fallback from LDAP login)`)
                  return callback(null, user) 
                })
                .catch((err) => {
                  console.error(`Could not log in user ${email} with either LDAP or local login`)
                  if (!require('node-errors').isCustomError(err)) return callback(err)
                  return callback(null, false, { message: err.message })
                })
          })
        } else {
          // Regular login, not LDAP
          models.User.login(email, password)
          .then((user) => {
            console.log(`Logged in user ${email} with local login`)
            return callback(null, user)
          })
          .catch((err) => {
            console.error(`Could not log in user ${email} with local login`)
            console.error(err)
            if (!require('node-errors').isCustomError(err)) return callback(err)
            return callback(null, false, { message: err.message })
          })
        }
      })
      .catch((err) => {
        console.error(`Error when getting authentication configuration`)
        console.error(err)
        if (!require('node-errors').isCustomError(err)) return callback(err)
        return callback(null, false, { message: err.message })
      })
  }))

  passport.serializeUser((user, callback) => {
    callback(null, user.id)
  })

  passport.deserializeUser((id, callback) => {
    models.User.find_by_id(id)
      .then((user) => {
        if (!user) {
          callback(null, null)
        }
        if (!mapUserIdToProjectId[user.id]) {
          // We don't have the project ID for this user yet. Get it
          var req = {
            method: 'GET',
            url: `${config.aro_service_url}/v1/user-project`,
            qs: {
              user_id: user.id
            },
            json: true
          }
          models.AROService.request(req)
            .then((result) => {
              user.projectId = result.id
              mapUserIdToProjectId[user.id] = user.projectId
              callback(null, user || null)
          })
        } else {
          user.projectId = mapUserIdToProjectId[user.id]  // This will have been saved on a successful login
          callback(null, user || null)
        }
      })
      .catch(callback)
  })

  app.get('/login', (request, response, next) => {
    response.render('login.html', {
      error: request.flash('error'),
      info: request.flash('info'),
      success: request.flash('success'),
      config: public_config
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
      error: request.flash('error'),
      config: public_config
    })
  })

  app.post('/forgot_password', (request, response, next) => {
    var email = request.body.email
    models.User.forgotPassword(email)
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
      code: code,
      config: public_config
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

    models.User.resetPassword(code, password)
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
