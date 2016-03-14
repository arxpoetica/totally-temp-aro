// Wirecenter
//
'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class Wirecenter {

  static findAll (viewport) {
    var sql = `
      SELECT id, geom, wirecenter AS name
      FROM aro.wirecenters
    `
    return database.polygons(sql, [], true, viewport)
  }

}
