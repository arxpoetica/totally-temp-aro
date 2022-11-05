// CountySubdivision
//
// The County Subdivision is a geographic area used in map layers.

import database from '../helpers/database.cjs'

export default class CountySubdivision {

  // Find all County Subdivisions in a US state by querying the `statefp` field
  //
  // 1. statefp: String. ex. '36' is New York state
  static findByStatefp (statefp, viewport) {
    var sql = `
      SELECT gid AS id, name, geom, ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid
      FROM aro.cousub WHERE
      ${database.intersects(viewport, 'geom', '')}
    `
    var params = []
    return database.polygons(sql, params, true, viewport)
  }

}
