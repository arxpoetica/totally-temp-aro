var models = require('../models')
var helpers = require('../helpers')
var passport = require('passport')
var querystring = require('querystring')
var public_config = helpers.public_config
var config = helpers.config
const authenticationConfigPromise = models.Authentication.getConfig('ldap')

exports.configure = (app, middleware) => {
  var LocalStrategy = require('passport-local').Strategy
  var CustomStrategy = require('passport-custom').Strategy
  var mapUserIdToProjectId = {}

  passport.use('local-username-password', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  (email, password, callback) => {
    authenticationConfigPromise
      .then((authenticationConfig) => {
        if (authenticationConfig && authenticationConfig.enabled) {
          console.log(`Attempting LDAP login for user ${email}`)
          models.User.loginLDAP(email, password)
            .then((user) => {
              console.log(`Successfully logged in user ${email} with LDAP`)
              console.log(user)
              user.twoFactorAuthenticationDone = true   // For now, no two-factor for ldap
              return callback(null, user)
            })
            .catch((err) => {
              console.warn(`LDAP login failed for user ${email}. Trying local login`)
              var loggedInUser = null
              models.User.login(email, password)
                .then((user) => { 
                  console.log(`Logged in user ${email} with local cached login (fallback from LDAP login)`)
                  loggedInUser = {
                    id: user.id
                  }
                  return models.User.doesUserNeedTwoFactor(loggedInUser.id)
                })
                .then(result => {
                  loggedInUser.twoFactorAuthenticationDone = !result.is_totp_enabled
                  return callback(null, loggedInUser) 
                })
                .catch((err) => {
                  console.error(`Could not log in user ${email} with either LDAP or local login`)
                  if (!require('node-errors').isCustomError(err)) return callback(err)
                  return callback(null, false, { message: err.message })
                })
          })
        } else {
          // Regular login, not LDAP
          var loggedInUser = null
          models.User.login(email, password)
          .then((user) => {
            console.log(`Logged in user ${email} with local login`)
            loggedInUser = {
              id: user.id
            }
            return models.User.doesUserNeedTwoFactor(loggedInUser.id)
          })
          .then(result => {
            loggedInUser.twoFactorAuthenticationDone = !result.is_totp_enabled
            return callback(null, loggedInUser)
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

  passport.use('custom-totp', new CustomStrategy(
    function(req, callback) {
      const verificationCode = req.body.verificationCode
      models.TwoFactor.verifyTotp(req.user.id, verificationCode)
        .then(result => {
          console.log(`Successfully verified OTP for user with id ${req.user.id}`)
          req.user.twoFactorAuthenticationDone = true
          callback(null, req.user)
        })
        .catch(err => {
          console.error(err)
          const message = 'The OTP code was invalid. If you are using an authenticator app, please ensure that your device time is correct'
          callback(null, false, { message: message })
        })
    }
  ))

  passport.serializeUser((user, callback) => {
    callback(null, {
      id: user.id,
      twoFactorAuthenticationDone: user.twoFactorAuthenticationDone
    })
  })

  passport.deserializeUser((user, callback) => {
    if (!user.id) {
      // This can happen if a user has logged in with an earlier version of ARO and has a cookie with just the user id
      callback(null, null)
    }
    models.User.find_by_id(user.id)
      .then((dbUser) => {
        if (!dbUser) {
          callback(null, null)
        }
        dbUser.twoFactorAuthenticationDone = user.twoFactorAuthenticationDone
        if (!mapUserIdToProjectId[dbUser.id]) {
          // We don't have the project ID for this user yet. Get it
          var req = {
            method: 'GET',
            url: `${config.aro_service_url}/v1/user-project`,
            qs: {
              user_id: dbUser.id
            },
            json: true
          }
          models.AROService.request(req)
            .then((result) => {
              dbUser.projectId = result.id
              mapUserIdToProjectId[dbUser.id] = dbUser.projectId
              callback(null, dbUser || null)
          })
        } else {
          dbUser.projectId = mapUserIdToProjectId[dbUser.id]  // This will have been saved on a successful login
          callback(null, dbUser || null)
        }
      })
      .catch(callback)
  })

  app.get('/verify-otp', (request, response, next) => {
    response.render('verify-otp.html', {
      error: request.flash('error'),
      info: request.flash('info'),
      success: request.flash('success'),
      config: public_config
    })
  })

  app.post('/verify-otp',
    passport.authenticate('custom-totp', {
      successRedirect: '/',
      failureRedirect: '/verify-otp',
      failureFlash: true
    })
  )

  app.get('/login', (request, response, next) => {
    response.render('login.html', {
      error: request.flash('error'),
      info: request.flash('info'),
      success: request.flash('success'),
      config: public_config
    })
  })

  app.post('/login',
    passport.authenticate('local-username-password', { successRedirect: '/',
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
