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
      WHERE ds.deleted=false
    `, [user.id])
  }

  static findAllBoundaries (user) {
    return database.query(`
      SELECT sl.id, sl.name, sl.description
      FROM client.service_layer sl
      WHERE sl.is_user_defined=false
      AND sl.deleted=false

      UNION ALL

      SELECT sl.id, sl.name, sl.description
      FROM client.service_layer sl
      JOIN user_data.data_source ds ON sl.data_source_id = ds.id AND ds.user_id=$1
      WHERE ds.deleted=false
    `, [user.id])
  }

  static editUserDefinedBoundary (user, id, name, file, radius) {
    return Promise.resolve()
      .then(() => {
        if (!id) {
          var req = {
            method: 'POST',
            url: config.aro_service_url + `/v1/project/${user.projectId}/library` + `?user_id=${user.id}`,
            body: {
              dataType: "equipment",
              name: name
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
        id = id || res.identifier
        if (!file) return { id: id }
        var req = {
          method: 'POST',
          url: config.aro_service_url + `/v1/library/${id}` + `?userId=${user.id}&media=CSV`,
          formData: {
            file: fs.createReadStream(file)
          }
        }
        return models.AROService.request(req)
          .then(() => {
            var req = {
              method: 'POST',
              url: config.aro_service_url + `/v1/project/${user.projectId}/serviceLayers-cmd` + `?user_id=${user.id}`,
              body: {
                action: 'GENERATE_POLYGONS',
                maxDistanceMeters: radius,
                equipmentLibraryId: id
              },
              json: true
            }
            return models.AROService.request(req)
              .then((res) => ({ id: id, name: res.serviceLayerLibrary.name}))
          })
      })
  }
  
  static getBoundariesInfo (serviceAreaIds) {
	  
	  var sql = `
      SELECT sa.id AS id,
             sa.code AS name,
             (CASE WHEN sl.is_user_defined=TRUE THEN 'user_defined' ELSE sl.name END) as type,
             sl.id as layer_id,
             ST_AsGeoJSON(geom)::json AS geog
      FROM client.service_area sa
      JOIN client.service_layer sl
        ON sa.service_layer_id = sl.id
      WHERE sa.id in ($1)
	  `
	  return database.query(sql, [serviceAreaIds])
  }

  // Returns the service area IDs of all service areas that contain locations from the given data sources
  static getServiceAreasContainingDataSources(dataSources, serviceLayerId) {
    var sql = `
      WITH all_service_areas AS (
        SELECT sa.id, sa.geom, sa.state FROM client.service_area sa
        JOIN client.service_layer sl
          ON sa.service_layer_id = sl.id
        WHERE sl.id=$2
      ),
      business_areas AS (
        SELECT DISTINCT sa.id
        FROM aro.businesses l
        JOIN all_service_areas sa
          ON ST_Contains(sa.geom, l.geom) AND l.data_source_id IN ($1)
      ),
      tower_areas AS (
        SELECT DISTINCT sa.id
        FROM aro.towers l
        JOIN all_service_areas sa
          ON ST_Contains(sa.geom, l.geom) AND l.data_source_id IN ($1)
      ),
      hh_areas AS (
        SELECT DISTINCT sa.id
        FROM aro.households l
        JOIN all_service_areas sa
          ON ST_Contains(sa.geom, l.geom) AND l.data_source_id IN ($1)
      )
      SELECT DISTINCT id
      FROM
        (SELECT *
          FROM business_areas
          UNION
          SELECT *
          FROM tower_areas
          UNION
          SELECT *
          FROM hh_areas
        ) a
    `
    return database.query(sql, [dataSources, serviceLayerId])
  }

  static getBoundaryForNetworkNode (planId, networkNodeObjectId, boundaryTypeId) {
    return database.query(`
      SELECT id,object_id,deployment_type
      FROM client.network_boundary
      WHERE root_plan_id = $1
        AND network_node_object_id = $2
        AND boundary_type = $3
        AND is_deleted=false;
    `, [planId, networkNodeObjectId, boundaryTypeId])
  }
}
