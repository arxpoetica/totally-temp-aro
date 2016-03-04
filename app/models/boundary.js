// Boundary

'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class Boundary {

  static create_boundary (plan_id, data) {
    return Promise.resolve()
      .then(() => {
        var sql = `
          INSERT INTO client.boundaries (plan_id, name, geom)
          VALUES ($1, $2, ST_GeomFromGeoJSON($3)) RETURNING id
        `
        var params = [
          plan_id,
          data.name,
          data.geom
        ]
        return database.findOne(sql, params)
      })
      .then((row) => {
        var sql = `
          SELECT id, name, ST_ASGeoJSON(geom)::json as geom
          FROM client.boundaries WHERE id=$1
        `
        return database.findOne(sql, [row.id])
      })
  }

  static delete_boundary (plan_id, boundary_id) {
    return database.execute('DELETE FROM client.boundaries WHERE id=$1 AND plan_id=$2',
      [boundary_id, plan_id])
  }

  static edit_boundary (data) {
    var sql = `
      UPDATE client.boundaries SET name=$1, geom=ST_GeomFromGeoJSON($2)
      WHERE id=$3 AND plan_id=$4
    `
    var params = [
      data.name,
      data.geom,
      data.id,
      data.plan_id // this may look redundant but it's for checking permissions
    ]
    return database.execute(sql, params)
  }

  static find_boundaries (plan_id) {
    var sql = `
      SELECT id, name, ST_ASGeoJSON(geom)::json as geom
      FROM client.boundaries WHERE plan_id=$1
    `
    return database.query(sql, [plan_id])
  }

}
