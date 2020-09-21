var helpers = require('../helpers')
var models = require('../models')

exports.configure = (app, middleware) => {
  const jsonSuccess = middleware.jsonSuccess

  app.get('/multifactor/overwrite-totp-secret', (request, response, next) => {
    const userId = request.user.id
    models.MultiFactor.overwriteTOTPSecretForUser(userId)    
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.get('/multifactor/get-totp-status', (request, response, next) => {
    const userId = request.user.id
    models.MultiFactor.getTotpStatus(userId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/multifactor/verify-totp-secret', (request, response, next) => {
    const userId = request.user.id
    const verificationCode = request.body.verificationCode
    models.MultiFactor.verifyTotp(userId, verificationCode)
      .then(res => models.MultiFactor.setTotpVerifiedFlag(userId, true))
      .then(res => models.MultiFactor.enableTotp(userId))
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/multifactor/delete-totp-settings', (request, response, next) => {
    const userId = request.user.id
    const verificationCode = request.body.verificationCode
    models.MultiFactor.deleteTotpSettingsForUser(userId, verificationCode)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
