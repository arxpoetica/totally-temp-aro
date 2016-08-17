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

  static findAllCMA (viewport) {
    var sql = `
      SELECT gid AS id, the_geom AS geom, name
      FROM boundaries.cma
    `
    return database.polygons(sql, [], true, viewport)
  }

}
