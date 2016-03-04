// Network
//
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var _ = require('underscore')
var request = require('request')
var config = helpers.config
var models = require('./')
var pync = require('pync')

module.exports = class Network {

  // View existing fiber plant for a carrier
  static view_fiber_plant_for_carrier (carrier_name, viewport) {
    return Promise.resolve()
      .then(() => {
        var sql
        if (viewport.zoom > viewport.threshold) {
          sql = `
            SELECT ST_AsGeoJSON(geom)::json AS geom
            FROM aro.fiber_plant
            WHERE carrier_name = $1
            AND ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($2)), 4326), geom)
          `
          return database.query(sql, [carrier_name, viewport.linestring])
        } else {
          sql = `
            WITH ${viewport.fishnet}
            SELECT ST_AsGeojson(fishnet.geom)::json AS geom, COUNT(*) AS density, NULL AS id
            FROM fishnet
            JOIN aro.fiber_plant ON fishnet.geom && fiber_plant.geom
            AND fiber_plant.carrier_name = $1
            GROUP BY fishnet.geom
          `
          return database.query(sql, [carrier_name])
        }
      })
      .then((rows) => {
        var features = rows.map((row) => ({
          type: 'Feature',
          geometry: row.geom,
          properties: {
            // density: row.density,
          }
        }))

        return {
          'feature_collection': {
            'type': 'FeatureCollection',
            'features': features
          }
        }
      })
  };

  // View existing fiber plant for competitors
  static view_fiber_plant_for_competitors (viewport) {
    return Promise.resolve()
      .then(() => {
        if (viewport.zoom <= viewport.threshold) return []
        var sql = `
          SELECT ST_AsGeoJSON(geom)::json AS geom
          FROM aro.fiber_plant
          WHERE carrier_name <> $1 AND ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($2)), 4326), geom)
        `
        return database.query(sql, [config.client_carrier_name, viewport.linestring])
      })
      .then((rows) => {
        var features = rows.map((row) => ({
          type: 'Feature',
          geometry: row.geom,
          properties: {
            density: row.density
          }
        }))

        return {
          'feature_collection': {
            'type': 'FeatureCollection',
            'features': features
          }
        }
      })
  }

  // View existing fiber plant for competitors
  static view_towers (viewport) {
    return Promise.resolve()
      .then(() => {
        if (viewport.zoom <= viewport.threshold) return []
        var sql = `
          SELECT ST_AsGeoJSON(geom)::json AS geom FROM aro.towers WHERE
          ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($1)), 4326), geom)
        `
        return database.query(sql, [viewport.linestring])
      })
      .then((rows) => {
        var features = rows.map((row) => {
          return {
            type: 'Feature',
            geometry: row.geom,
            properties: {
            }
          }
        })

        return {
          'feature_collection': {
            'type': 'FeatureCollection',
            'features': features
          }
        }
      })
  }

  // View existing fiber plant for competitors with a heat map
  static view_fiber_plant_density (viewport) {
    return Promise.resolve()
      .then(() => {
        var sql = `
          WITH ${viewport.fishnet}
          SELECT
            ST_AsGeojson(fishnet.geom)::json AS geom,
            COUNT(DISTINCT fiber_plant.carrier_name) AS density,
            NULL AS id
          FROM fishnet
          JOIN aro.fiber_plant ON fishnet.geom && fiber_plant.geom
          AND fiber_plant.carrier_name <> $1
          GROUP BY fishnet.geom
        `
        return database.query(sql, [config.client_carrier_name])
      })
      .then((rows) => {
        var features = rows.map((row) => ({
          type: 'Feature',
          geometry: row.geom,
          properties: {
            density: row.density
          }
        }))

        return {
          'feature_collection': {
            'type': 'FeatureCollection',
            'features': features
          }
        }
      })
  }

  static carriers (plan_id) {
    return models.MarketSize.carriers_by_city_of_plan(plan_id, true)
  }

  // View the user client's network nodes
  //
  // 1. node_type String (ex. 'central_office', 'fiber_distribution_hub', 'fiber_distribution_terminal')
  // 2. plan_id Number Pass a plan_id to find additionally the network nodes associated to that route
  static view_network_nodes (node_types, plan_id) {
    return Promise.resolve()
      .then(() => {
        var sql = `
          SELECT
            n.id, ST_AsGeoJSON(geog)::json AS geom, t.name AS name, n.plan_id
          FROM client.network_nodes n
          JOIN client.network_node_types t
            ON n.node_type_id = t.id
        `
        var params = []
        var constraints = []

        if (node_types && node_types.length > 0) {
          var arr = []
          node_types.forEach((node_type) => {
            params.push(node_type)
            arr.push('t.name = $' + params.length)
          })
          constraints.push('(' + arr.join(' OR ') + ')')
        }

        if (plan_id) {
          params.push(plan_id)
          constraints.push(`
            (plan_id IS NULL OR plan_id IN (
              SELECT id FROM client.plan WHERE parent_plan_id=$${params.length}
              UNION ALL
              SELECT $${params.length}
            ))`)
        } else {
          constraints.push('plan_id IS NULL')
        }

        if (constraints.length > 0) {
          sql += ' WHERE ' + constraints.join(' AND ')
        }
        return database.query(sql, params)
      })
      .then((rows) => {
        var features = rows.map((row) => ({
          'type': 'Feature',
          'properties': {
            'id': row.id,
            'type': row.name,
            'icon': `/images/map_icons/${row.name}.png`,
            'unselectable': row.name !== 'central_office',
            'draggable': !!row.plan_id
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

  // View all the available network node types
  static view_network_node_types () {
    return database.query('SELECT * FROM client.network_node_types')
  }

  static edit_network_nodes (plan_id, changes) {
    return Promise.resolve()
      .then(() => this._add_nodes(plan_id, changes.insertions))
      .then(() => this._update_nodes(plan_id, changes.updates))
      .then(() => this._delete_nodes(plan_id, changes.deletions))
      .then(() => (
        database.execute('UPDATE client.plan SET updated_at=NOW() WHERE id=$1', [plan_id])
      ))
  }

  static _add_nodes (plan_id, insertions) {
    return Promise.resolve()
      .then(() => {
        if (!_.isArray(insertions) || insertions.length === 0) return
        var sql = 'INSERT INTO client.network_nodes (node_type_id, geog, geom, plan_id) VALUES '
        var params = []
        var arr = []
        insertions.forEach((node) => {
          var i = params.length
          params.push(node.type)
          params.push(`POINT(${node.lon} ${node.lat})`)
          params.push(`POINT(${node.lon} ${node.lat})`)
          params.push(plan_id)
          arr.push('($' + (i + 1) + ', ST_GeogFromText($' + (i + 2) + '), ST_GeomFromText($' + (i + 3) + ', 4326), $' + (i + 4) + ')')
        })
        sql += arr.join(', ')
        return database.execute(sql, params)
      })
  }

  static _update_nodes (plan_id, updates) {
    return Promise.resolve()
      .then(() => {
        if (!_.isArray(updates)) return
        return pync.series(updates, (node) => {
          var sql = `
            UPDATE client.network_nodes
            SET geog=ST_GeogFromText($1), geom=ST_GeomFromText($2, 4326)
            WHERE id=$3 AND plan_id=$4
          `
          var params = [
            `POINT(${node.lon} ${node.lat})`,
            `POINT(${node.lon} ${node.lat})`,
            node.id,
            plan_id
          ]
          return database.execute(sql, params)
        })
      })
  }

  static _delete_nodes (plan_id, updates) {
    return Promise.resolve()
      .then(() => {
        if (!_.isArray(updates)) return
        return pync.series(updates, (node) => {
          var sql = 'DELETE FROM client.network_nodes WHERE id=$1 AND plan_id=$2'
          var params = [node.id, plan_id]
          return database.execute(sql, params)
        })
      })
  }

  static clear_network_nodes (plan_id) {
    return database.execute('DELETE FROM client.network_nodes WHERE plan_id=$1;', [plan_id])
  }

  static recalculate_nodes (plan_id, algorithm) {
    return new Promise((resolve, reject) => {
      var options = {
        method: 'POST',
        url: config.aro_service_url + '/rest/recalc/masterplan',
        json: true,
        body: {
          planId: plan_id
        }
      }
      console.log('sending request to aro-service', options)
      request(options, (err, res, body) => {
        if (err) return reject(err)
        console.log('ARO-service responded with', res.statusCode, body)
        resolve()
      })
    })
  }

  static select_boundary (plan_id, data) {
    return Promise.resolve()
      .then(() => {
        // select all the locations inside that boundary
        // TODO: this could create duplicates!
        var sql = `
          INSERT INTO client.plan_targets (location_id, plan_id)
          (SELECT locations.id, $2 AS plan_id
             FROM locations
            WHERE ST_Intersects(ST_GeomFromGeoJSON($1)::geography, locations.geog))
        `
        return database.execute(sql, [data.boundary, plan_id])
      })
      .then((count) => (
        // models.NetworkPlan.recalculate_route(plan_id, data.algorithm, callback);
        models.Network.recalculate_nodes(plan_id, data.algorithm)
      ))
  }

}
