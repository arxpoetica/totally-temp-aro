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
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
