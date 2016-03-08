// CensusBlock
//
// The County Subdivision is a geographic area used in map layers.
'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class CensusBlock {

  static findByStatefpAndCountyfp (statefp, countyfp, viewport) {
    var sql = `
      SELECT gid as id, name, geom
      FROM aro.census_blocks
      WHERE statefp = $1 AND countyfp = $2
    `
    var params = [statefp, countyfp]
    return database.polygons(sql, params, true, viewport)
  }

}
