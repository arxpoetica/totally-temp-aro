'use strict'

var request = require('request')

module.exports = class AROService {

  static request (req) {
    if (process.env.NODE_ENV === 'test') return Promise.resolve({})
    req.timeout = req.timeout || 60 * 60 * 1000 // 30min
    console.log('Sending request to aro-service', JSON.stringify(req, null, 2))
    return new Promise((resolve, reject) => {
      var formData = req.formData
      delete req.formData
      console.log('req', req)
      var r = request(req, (err, res, body) => {
        if (err) return reject(err)
        console.log('ARO-service responded with', res.statusCode, JSON.stringify(body, null, 2))
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`ARO-service returned status code ${res.statusCode}`))
        }
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
