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
  static viewFiberPlantForCarrier (carrier_name, viewport) {
    var sql = `
      SELECT geom
      FROM aro.fiber_plant
      WHERE carrier_name = $1
    `
    return database.lines(sql, [carrier_name], true, viewport)
  }

  // View existing fiber plant for competitors
  static viewFiberPlantForCompetitors (viewport) {
    var sql = `
      SELECT geom
      FROM aro.fiber_plant
      WHERE carrier_id <> (SELECT id FROM carriers WHERE name=$1)
    `
    return database.lines(sql, [config.client_carrier_name], true, viewport)
  }

  // View existing fiber plant for competitors with a heat map
  static viewFiberPlantDensity (viewport) {
    var sql = `
      SELECT geom, carrier_name
      FROM fiber_plant
      WHERE carrier_name <> $1
    `
    var density = 'COUNT(DISTINCT features.carrier_name)'
    return database.density(sql, [config.client_carrier_name], true, viewport, density)
  }

  static carriers (plan_id) {
    return models.MarketSize.carriersByCityOfPlan(plan_id, true)
  }

  // View the user client's network nodes
  //
  // 1. node_type String (ex. 'central_office', 'fiber_distribution_hub', 'fiber_distribution_terminal')
  // 2. plan_id Number Pass a plan_id to find additionally the network nodes associated to that route
  static viewNetworkNodes (node_types, plan_id, viewport) {
    return Promise.resolve()
      .then(() => {
        var sql = `
          SELECT
            n.id, ST_AsGeoJSON(geom)::json AS geom, t.name AS name,
            '/images/map_icons/${process.env.ARO_CLIENT}/' || t.name || '.png' AS icon,
            plan_id IS NOT NULL AS draggable,
            name <> 'central_office' AS unselectable
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
        return database.query(sql, params, true)
      })
  }

  // View all the available network node types
  static viewNetworkNodeTypes () {
    return database.query('SELECT * FROM client.network_node_types')
  }

  static editNetworkNodes (plan_id, changes) {
    return Promise.resolve()
      .then(() => this._addNodes(plan_id, changes.insertions))
      .then(() => this._updateNodes(plan_id, changes.updates))
      .then(() => this._deleteNodes(plan_id, changes.deletions))
      .then(() => (
        database.execute('UPDATE client.plan SET updated_at=NOW() WHERE id=$1', [plan_id])
      ))
  }

  static _addNodes (plan_id, insertions) {
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

  static _updateNodes (plan_id, updates) {
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

  static _deleteNodes (plan_id, updates) {
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

  static clearNetworkNodes (plan_id) {
    return database.execute('DELETE FROM client.network_nodes WHERE plan_id=$1;', [plan_id])
  }

  static recalculateNodes (plan_id, algorithm) {
    return new Promise((resolve, reject) => {
      var options = {
        method: 'POST',
        url: config.aro_service_url + '/rest/recalc/masterplan',
        json: true,
        body: {
          planId: plan_id,
          algorithm: algorithm
        }
      }
      console.log('sending request to aro-service', options)
      request(options, (err, res, body) => {
        if (err) return reject(err)
        // if (err) return resolve()
        console.log('ARO-service responded with', res.statusCode, body)
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`ARO-service returned status code ${res.statusCode}`))
        }
        resolve()
      })
    })
  }

  static selectBoundary (plan_id, data) {
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
        models.Network.recalculateNodes(plan_id, data.algorithm)
      ))
  }

  static searchBoundaries (text) {
    var sql = `
      SELECT 'wirecenter:' || id AS id, wirecenter AS name, ST_AsGeoJSON(geom)::json AS geog
        FROM wirecenters
       WHERE lower(unaccent(wirecenter)) LIKE lower(unaccent($1))

      UNION ALL

      SELECT 'census_block:' || gid AS id, name, ST_AsGeoJSON(geom)::json AS geog
        FROM census_blocks
       WHERE lower(unaccent(name)) LIKE lower(unaccent($1))

      UNION ALL

      SELECT 'custom_boundary:' || id AS id, name, ST_AsGeoJSON(geom)::json AS geog
        FROM client.boundaries
       WHERE lower(unaccent(name)) LIKE lower(unaccent($1))

       UNION ALL

      SELECT 'county:' || gid AS id, name, ST_AsGeoJSON(geom)::json AS geog
        FROM aro.cousub
       WHERE lower(unaccent(name)) LIKE lower(unaccent($1))

      LIMIT 100
    `
    return database.query(sql, [`%${text}%`])
  }

}
