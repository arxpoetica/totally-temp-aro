import passport from 'passport'
import querystring from 'querystring'
import nodeErrors from 'node-errors'
import Authentication from '../models/authentication.js'
import User from '../models/user.js'
import AROService from '../models/aro_service.js'
import MultiFactor from '../models/multifactor.js'
import config from '../helpers/config.cjs'
import public_config from '../helpers/public_config.js'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as CustomStrategy } from 'passport-custom'

const authenticationConfigPromise = Authentication.getConfig('ldap')

export const configure = (app, middleware) => {
  var mapUserIdToProjectId = {}
  const jsonSuccess = middleware.jsonSuccess

  passport.use('local-username-password', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  (email, password, callback) => {
    authenticationConfigPromise
      .then((authenticationConfig) => {
        if (authenticationConfig && authenticationConfig.enabled) {
          console.log(`Attempting LDAP login for user ${email}`)
          User.loginLDAP(email, password)
            .then((user) => {
              console.log(`Successfully logged in user ${email} with LDAP`)
              console.log(user)
              user.multiFactorAuthenticationDone = true   // For now, no two-factor for ldap
              return callback(null, user)
            })
            .catch((err) => {
              console.warn(`LDAP login failed for user ${email}. Trying local login`)
              var loggedInUser = null
              User.login(email, password)
                .then((user) => { 
                  console.log(`Logged in user ${email} with local cached login (fallback from LDAP login)`)
                  loggedInUser = {
                    id: user.id
                  }
                  return User.doesUserNeedMultiFactor(loggedInUser.id)
                })
                .then(result => {
                  loggedInUser.multiFactorAuthenticationDone = !result.is_totp_enabled
                  return callback(null, loggedInUser) 
                })
                .catch((err) => {
                  console.error(`Could not log in user ${email} with either LDAP or local login`)
                  if (!nodeErrors.isCustomError(err)) return callback(err)
                  return callback(null, false, { message: err.message })
                })
          })
        } else {
          // Regular login, not LDAP
          var loggedInUser = null
          User.login(email, password)
          .then((user) => {
            console.log(`Logged in user ${email} with local login`)
            loggedInUser = {
              id: user.id
            }
            return User.doesUserNeedMultiFactor(loggedInUser.id)
          })
          .then(result => {
            loggedInUser.multiFactorAuthenticationDone = !result.is_totp_enabled
            return callback(null, loggedInUser)
          })
          .catch((err) => {
            console.error(`Could not log in user ${email} with local login`)
            console.error(err)
            if (!nodeErrors.isCustomError(err)) return callback(err)
            return callback(null, false, { message: err.message })
          })
        }
      })
      .catch((err) => {
        console.error(`Error when getting authentication configuration`)
        console.error(err)
        if (!nodeErrors.isCustomError(err)) return callback(err)
        return callback(null, false, { message: err.message })
      })
  }))

  passport.use('custom-totp', new CustomStrategy(
    function(req, callback) {
      const verificationCode = req.body.verificationCode
      const errorMessage = 'The OTP code was invalid. If you are using an authenticator app, please ensure that your device time is correct'
      MultiFactor.verifyTotp(req.user.id, verificationCode)
        .then(result => {
          console.log(`Successfully verified OTP for user with id ${req.user.id}`)
          req.user.multiFactorAuthenticationDone = true
          callback(null, req.user)
        })
        .catch(err => {
          console.error(err)
          callback(null, false, { message: errorMessage })
        })
    }
  ))

  passport.serializeUser((user, callback) => {
    callback(null, {
      id: user.id,
      multiFactorAuthenticationDone: user.multiFactorAuthenticationDone,
      version: '1'
    })
  })

  passport.deserializeUser((user, callback) => {
    if (!user.id) {
      // This can happen if a user has logged in with an earlier version of ARO and has a cookie with just the user id
      callback(null, null)
    }
    User.find_by_id(user.id)
      .then((dbUser) => {
        if (!dbUser) {
          callback(null, null)
        }
        dbUser.multiFactorAuthenticationDone = user.multiFactorAuthenticationDone
        dbUser.version = user.version
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
          AROService.request(req)
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
      .catch(() => {
        // Something went wrong when deserializing the user. This can happen if the session cookie is from an earlier version
        // of ARO, or if the user has been deleted, or some other reason.
        callback(null, null)
      })
  })

  app.get('/verify-otp', (request, response, next) => {
    response.render('verify-otp.html', {
      error: request.flash('error'),
      info: request.flash('info'),
      success: request.flash('success'),
      config: public_config,
      ARO_CLIENT: process.env.ARO_CLIENT
    })
  })

  app.post('/verify-otp',
    passport.authenticate('custom-totp', {
      successRedirect: '/',
      failureRedirect: '/verify-otp',
      failureFlash: true
    })
  )

  // Putting this API here because we need to be able to email an OTP after being logged in with username/password only
  app.post('/send-totp-by-email', (request, response, next) => {
    var totpPromise = null
    if (!request.user || !request.user.id) {
      totpPromise = Promise.reject('User ID not found, cannot send OTP')
    } else {
      const userId = request.user.id
      totpPromise = MultiFactor.sendTotpByEmail(userId)
    }
    totpPromise
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.get('/login', (request, response, next) => {
    response.render('login.html', {
      error: request.flash('error'),
      info: request.flash('info'),
      success: request.flash('success'),
      config: public_config,
      ARO_CLIENT: process.env.ARO_CLIENT
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
      config: public_config,
      ARO_CLIENT: process.env.ARO_CLIENT
    })
  })

  app.post('/forgot_password', (request, response, next) => {
    var email = request.body.email
    User.forgotPassword(email)
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
      config: public_config,
      ARO_CLIENT: process.env.ARO_CLIENT
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

    User.resetPassword(code, password)
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
