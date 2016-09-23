// Wirecenter
//
'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class Wirecenter {

  static findServiceAreas (viewport, type) {
    var sql = `
      SELECT service_area.id, geom, code AS name, ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid
        FROM client.service_area
        JOIN client.service_layer
          ON service_area.service_layer_id = service_layer.id
        AND service_layer.name=$1
        ${database.intersects(viewport, 'geom', 'WHERE')}
    `
    return database.polygons(sql, [type], true, viewport)
  }

  static findAnalysisAreas (viewport, type) {
    var sql = `
      SELECT analysis_area.id, geom, code AS name, ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid
        FROM client.analysis_area
        JOIN client.analysis_layer
          ON analysis_area.analysis_layer_id = analysis_layer.id
        AND analysis_layer.name=$1
        ${database.intersects(viewport, 'geom', 'WHERE')}
    `
    return database.polygons(sql, [type], true, viewport)
  }

}
