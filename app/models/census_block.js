// CensusBlock
//
// The County Subdivision is a geographic area used in map layers.
'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class CensusBlock {

  static findByStatefpAndCountyfp (viewport) {
    var sql = `
      SELECT gid as id, name, geom, ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid
      FROM aro.census_blocks
      WHERE
      ${database.intersects(viewport, 'geom', '')}
    `
    var params = []
    return database.polygons(sql, params, true, viewport)
  }

  static findByNbmCarrier (carrier, viewport) {
    var sql = `
      SELECT
        cb.gid AS id,
        cb.tabblock_id,
        ST_AsGeoJSON(cb.geom)::json AS geom,
        cb.name,
        cbc.download_speed,
        cbc.upload_speed,
        s.description AS speed,
        ST_AsGeoJSON(ST_Centroid(cb.geom))::json AS centroid
      FROM aro.census_blocks cb
      JOIN client.census_blocks_carriers cbc
        ON cbc.census_block_gid = cb.gid
      JOIN aro.carriers c
        ON cbc.carrier_id = c.id
       AND c.id = $1
      JOIN client.speeds s
        ON s.code = cbc.download_speed
      ${database.intersects(viewport, 'cb.geom', 'WHERE')}
    `
    var params = [carrier]
    return database.query(sql, params, true)
  }

  static findAllNbmCarriers (viewport) {
    var sql = `
        SELECT DISTINCT ON (cb.gid)
          cb.gid AS id,
          cb.tabblock_id,
          ST_AsGeoJSON(cb.geom)::json AS geom,
          cb.name,
          cbc.download_speed,
          cbc.upload_speed,
          s.description AS speed,
          ST_AsGeoJSON(ST_Centroid(cb.geom))::json AS centroid
        FROM aro.census_blocks cb
        JOIN client.census_blocks_carriers cbc
          ON cbc.census_block_gid = cb.gid
        JOIN client.speeds s
          ON s.code = cbc.download_speed
       ${database.intersects(viewport, 'cb.geom', 'WHERE')}
       ORDER BY cb.gid, cbc.download_speed DESC
    `
    return database.query(sql, [], true)
  }

  static findCarriers (id) {
    var sql = `
      SELECT
        cbc.census_block_gid AS id,
        carriers.name AS carrier_name,
        s.description AS speed
       FROM client.census_blocks_carriers cbc
       JOIN network_provider.carrier ON carriers.id = cbc.carrier_id
       JOIN client.speeds s ON s.code = cbc.download_speed
      WHERE cbc.census_block_gid=$1
      ORDER BY carriers.name ASC
    `
    return database.query(sql, [id])
  }

  static getCensusBlockDetails (id) {
    var sql = `
      SELECT gid as id, name, tabblock_id, aland, awater, area_meters, ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid
      FROM aro.census_blocks
      WHERE
      gid=$1
    `
    return database.findOne(sql, [id])
  }

}
