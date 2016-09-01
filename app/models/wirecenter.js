// Wirecenter
//
'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class Wirecenter {

  static findServiceAreas (viewport, type) {
    var sql = `
      SELECT service_area.id, geom, code AS name
        FROM client.service_area
        JOIN client.service_layer
          ON service_area.service_layer_id = service_layer.id
        AND service_layer.name=$1
    `
    return database.polygons(sql, [type], true, viewport)
  }

  static findCMA (viewport) {
    var sql = `
      SELECT gid AS id, the_geom AS geom, name
      FROM ref_boundaries.cma
    `
    return database.polygons(sql, [], true, viewport)
  }

}
