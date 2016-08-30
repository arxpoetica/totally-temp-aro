// Wirecenter
//
'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class Wirecenter {

  static findAll (viewport) {
    var sql = `
      SELECT id, geom, code AS name
        FROM client.service_area
       WHERE service_layer_id = (
        SELECT id FROM client.service_layer WHERE name='wirecenter'
      )
    `
    return database.polygons(sql, [], true, viewport)
  }

  static findAllCMA (viewport) {
    var sql = `
      SELECT gid AS id, the_geom AS geom, name
      FROM ref_boundaries.cma
    `
    return database.polygons(sql, [], true, viewport)
  }

  static findAllDirectionalFacilities (viewport) {
    var sql = `
      SELECT id, geom, code AS name
        FROM client.service_area
       WHERE service_layer_id = (
        SELECT id FROM client.service_layer WHERE name='directional_facility'
      )
    `
    return database.polygons(sql, [], true, viewport)
  }

}
