// CountySubdivision
//
// The County Subdivision is a geographic area used in map layers.
'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class CountySubdivision {

  // Find all County Subdivisions in a US state by querying the `statefp` field
  //
  // 1. statefp: String. ex. '36' is New York state
  static find_by_statefp (statefp, viewport) {
    var sql = `
      SELECT gid AS id, name, ST_AsGeoJSON(ST_Simplify(geom, $3))::json AS geom FROM aro.cousub
      WHERE statefp = $1
      AND ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($2)), 4326), geom)
    `
    var params = [statefp, viewport.linestring, viewport.simplify_factor]
    return database.query(sql, params)
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
