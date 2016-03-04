// CensusBlock
//
// The County Subdivision is a geographic area used in map layers.
'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class CensusBlock {

  static find_by_statefp_and_countyfp (statefp, countyfp, viewport) {
    return Promise.resolve()
      .then(() => {
        var sql, params
        if (viewport.zoom > viewport.threshold) {
          sql = `
            SELECT gid as id, name, ST_AsGeoJSON(ST_Simplify(geom, $4))::json AS geom FROM aro.census_blocks
            WHERE statefp = $1 AND countyfp = $2
            AND ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($3)), 4326), geom)
          `
          params = [statefp, countyfp, viewport.linestring, viewport.simplify_factor]
        } else {
          sql = `
            SELECT ST_AsGeoJSON(ST_Simplify(ST_Union(geom), $4))::json AS geom FROM aro.census_blocks
            WHERE statefp = $1 AND countyfp = $2
            AND ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($3)), 4326), geom)
          `
          params = [statefp, countyfp, viewport.linestring, viewport.simplify_factor]
        }
        return database.query(sql, params)
      })
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
