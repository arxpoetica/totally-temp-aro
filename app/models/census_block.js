// CensusBlock
//
// The County Subdivision is a geographic area used in map layers.
'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class CensusBlock {

  // FIXME: legacy code, transfer to service
  static getCensusBlockDetails (id) {
    var sql = `
      SELECT gid as id, name, tabblock_id, aland, awater, area_meters, ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid, hstore_to_json(attributes) AS attributes
      FROM aro.census_blocks
      WHERE
      id=$1
    `
    return database.findOne(sql, [id])
  }

}
