'use strict'

var pify = require('pify')
var request = pify(require('request'), { multiArgs: true })

module.exports = class AROService {

  static request (req) {
    console.log('Sending request to aro-service', JSON.stringify(req, null, 2))
    return request(req).then((result) => {
      var res = result[0]
      var body = result[1]
      console.log('ARO-service responded with', res.statusCode, JSON.stringify(body, null, 2))
      if (res.statusCode && res.statusCode >= 400) {
        return Promise.reject(new Error(`ARO-service returned status code ${res.statusCode}`))
      }
      return body
    })
  }

}
