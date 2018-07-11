'use strict'

var models = require('../models')
var helpers = require('../helpers')
var config = helpers.config
var VectorTile = require('vector-tile').VectorTile
var Protobuf = require('pbf')
var request = require('request')

module.exports = class Tiles {

  static getTileData(tileUrl, requestBody) {

    // Construct the tile URL to get data from a server
    // Note that we use "encoding: null" as we are getting binary data from aro-service
    requestBody.forEach((item, index) => {
      delete requestBody[index].dataId
    })
    var tileRequest = {
      method: 'POST',
      url: `${config.aro_service_url}/${tileUrl}`,
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      encoding: null
    }

    return new Promise((resolve, reject) => {
      request(tileRequest, (error, response, body) => {
        if (error) {
          reject(error)
        } else {
          // "body" will be a binary buffer. Return it as-is
          resolve(body)
        }
      })    
    })
  }

}
