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

  static findByNbmCarrier (carrier, viewport) {
    var sql = `
      SELECT
        cb.geom,
        cb.name,
        cbc.download_speed,
        cbc.upload_speed,
        s.description AS speed,
        ST_AsGeoJSON(ST_Centroid(cb.geom))::json as centroid
      FROM aro.census_blocks cb
      JOIN client.census_bocks_carriers cbc
        ON cbc.census_block_gid = cb.gid
      JOIN aro.carriers c
        ON cbc.carrier_id = c.id
       AND c.id = $1
      JOIN client.speeds s
        ON s.code = cbc.download_speed
    `
    var params = [carrier]
    return database.polygons(sql, params, true, viewport)
  }

}
