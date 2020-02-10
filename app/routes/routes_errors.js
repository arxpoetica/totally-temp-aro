var request = require('request')
const helpers = require('../helpers')

exports.configure = (app, middleware) => {
  // For testing the error handler
  app.get('/error', (request, response, next) => {
    next(new Error('test'))
  })

  // error handler
  app.use((err, req, res, next) => {
    helpers.logger.error(err)
    res.status(err.status).json(err.body)
  })
}
