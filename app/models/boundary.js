// Boundary

'use strict'

var helpers = require('../helpers')
var database = helpers.database
var config = helpers.config
var models = require('../models')
var fs = require('fs')

module.exports = class Boundary {

  static createBoundary (plan_id, data) {
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

  static deleteBoundary (plan_id, boundary_id) {
    return database.execute('DELETE FROM client.boundaries WHERE id=$1 AND plan_id=$2',
      [boundary_id, plan_id])
  }

  static editBoundary (data) {
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

  static findBoundary (plan_id) {
    var sql = `
      SELECT id, name, ST_ASGeoJSON(geom)::json as geom
      FROM client.boundaries WHERE plan_id=$1
    `
    return database.query(sql, [plan_id])
  }

  static findUserDefinedBoundaries (user) {
    return database.query(`
      SELECT sl.id, sl.name, sl.description
      FROM client.service_layer sl
      JOIN user_data.data_source ds ON sl.data_source_id = ds.id AND ds.user_id=$1
    `, [user.id])
  }

  static editUserDefinedBoundary (user, id, name, file, radius) {
    return Promise.resolve()
      .then(() => {
        if (!id) {
          var req = {
            method: 'POST',
            url: config.aro_service_url + '/rest/serviceLayers',
            body: {
              layerDescription: name,
              layerName: name,
              userId: user.id
            },
            json: true
          }
          return models.AROService.request(req)
        } else {
          return Promise.resolve()
          // return database.execute('UPDATE user_data.data_source SET name=$1, description=$1 WHERE id=$2', [name, id])
        }
      })
      .then((res) => {
        id = id || res.id
        if (!file) return { id: id }
        var req = {
          method: 'POST',
          url: config.aro_service_url + `/rest/serviceLayers/${id}/entities.csv`,
          formData: {
            file: fs.createReadStream(file)
          }
        }
        return models.AROService.request(req)
          .then(() => {
            var req = {
              method: 'POST',
              url: config.aro_service_url + `/rest/serviceLayers/${id}/command`,
              body: {
                action: 'GENERATE_POLYGONS',
                maxDistanceMeters: radius
              },
              json: true
            }
            return models.AROService.request(req)
              .then(() => ({ id: id }))
          })
      })
  }

}
