// Wirecenter
//
'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class Wirecenter {

  static findAll (viewport) {
    var sql = `
      SELECT id, ST_AsGeoJSON(ST_Simplify(geom, 0.00015))::json AS geom, wirecenter AS name
      FROM aro.wirecenters
      WHERE ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($1)), 4326), geom)
    `
    return database.query(sql, [viewport.linestring])
      .then((rows) => {
        var features = rows.map((row) => {
          return {
            'type': 'Feature',
            'properties': {
              'id': row.id,
              'name': row.name
            },
            'geometry': row.geom
          }
        })

        return {
          'feature_collection': {
            'type': 'FeatureCollection',
            'features': features
          }
        }
      })
  }

  static findByWirecenterCode (wirecenter_code) {
    var sql = `
      SELECT id, ST_AsGeoJSON(geom)::json AS geom, wirecenter AS name
      FROM aro.wirecenters
      WHERE wirecenter = $1
    `
    return database.query(sql, [wirecenter_code])
      .then((rows) => {
        var features = rows.map((row) => ({
          'type': 'Feature',
          'properties': {
            'id': row.id,
            'name': row.name
          },
          'geometry': row.geom
        }))

        return {
          'feature_collection': {
            'type': 'FeatureCollection',
            'features': features
          }
        }
      })
  }

}
