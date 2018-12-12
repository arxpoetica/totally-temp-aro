var helpers = require('../helpers')
var models = require('../models')

exports.configure = (app, middleware) => {
  const jsonSuccess = middleware.jsonSuccess

  app.get('/auth/overwrite-totp-secret', (request, response, next) => {
    const userId = request.user.id

    models.TwoFactor.overwriteTOTPSecretForUser(userId)    
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.get('/auth/get-totp-status', (request, response, next) => {
    const userId = request.user.id
    models.TwoFactor.getTotpStatus(userId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/auth/verify-totp', (request, response, next) => {
    const userId = request.user.id
    const verificationCode = request.body.verificationCode
    models.TwoFactor.verifyTotp(userId, verificationCode)
      .then(res => models.TwoFactor.setTotpVerifiedFlag(userId, true))  // OTP is verified, update the DB.
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/auth/enable-totp', (request, response, next) => {
    const userId = request.user.id
    models.TwoFactor.enableTotp(userId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/auth/delete-totp-settings', (request, response, next) => {
    const userId = request.user.id
    const verificationCode = request.body.verificationCode
    models.TwoFactor.deleteTotpSettingsForUser(userId, verificationCode)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
