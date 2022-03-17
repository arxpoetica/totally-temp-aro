'use strict'

var request = require('request')
const { createLogger, LOGGER_GROUPS } = require('../helpers/logger')
const logger = createLogger(LOGGER_GROUPS.ARO_SERVICE)

module.exports = class AROService {

  static request (req) {
    if (process.env.NODE_ENV === 'test') return Promise.resolve({})
    req.timeout = req.timeout || 60 * 60 * 1000 // 30min
    logger.info(`Sending request to aro-service ${JSON.stringify(req, null, 2)}`)
    return new Promise((resolve, reject) => {
      var formData = req.formData
      delete req.formData
      logger.info(`req ${JSON.stringify(req, null, 2)}`)
      var r = request(req, (err, res, body) => {
        if (err) return reject(err)
        if (res.statusCode && res.statusCode >= 400) {
          logger.info(`ARO-service responded with ${res.statusCode} ${JSON.stringify(body, null, 2)}`)
          return reject({
            status: res.statusCode,
            body: res.body
          })
        }
        logger.info(`ARO-service responded with ${res.statusCode}`)
        return resolve(body)
      })
      if (formData) {
        var form = r.form()
        Object.keys(formData).forEach((key) => {
          form.append(key, formData[key])
        })
      }
    })
  }

}
