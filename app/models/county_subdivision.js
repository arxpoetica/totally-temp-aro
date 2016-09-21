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
  static findByStatefp (statefp, viewport) {
    var sql = `
      SELECT gid AS id, name, geom
      FROM aro.cousub
      WHERE statefp = $1
      ${database.intersects(viewport, 'geom', 'AND')}
    `
    var params = [statefp]
    return database.polygons(sql, params, true, viewport)
  }

}
