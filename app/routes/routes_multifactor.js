import MultiFactor from '../models/multifactor.js'

export const configure = (app, middleware) => {
  const jsonSuccess = middleware.jsonSuccess

  app.get('/multifactor/overwrite-totp-secret', (request, response, next) => {
    const userId = request.user.id
    MultiFactor.overwriteTOTPSecretForUser(userId)    
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.get('/multifactor/get-totp-status', (request, response, next) => {
    const userId = request.user.id
    MultiFactor.getTotpStatus(userId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/multifactor/verify-totp-secret', (request, response, next) => {
    const userId = request.user.id
    const verificationCode = request.body.verificationCode
    MultiFactor.verifyTotp(userId, verificationCode)
      .then(res => MultiFactor.setTotpVerifiedFlag(userId, true))
      .then(res => MultiFactor.enableTotp(userId))
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  app.post('/multifactor/delete-totp-settings', (request, response, next) => {
    const userId = request.user.id
    const verificationCode = request.body.verificationCode
    MultiFactor.deleteTotpSettingsForUser(userId, verificationCode)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
