// Network
//
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var _ = require('underscore')
var config = helpers.config
var models = require('./')
var pync = require('pync')
var fs = require('fs')
var parse = require('csv-parse')
var transform = require('stream-transform')

module.exports = class Network {

  // View existing fiber plant for the current carrier
  static viewFiberByConstructionType (plan_id, type, viewport) {
    var sql = `
      SELECT seg.geom
        FROM client.fiber_route_segment seg
        JOIN client.fiber_route fr ON seg.fiber_route_id = fr.id
       WHERE fr.plan_id IN (SELECT id FROM client.plan WHERE parent_plan_id=$1)
        AND seg.cable_construction_type_id = (
          SELECT id FROM client.cable_construction_type WHERE name=$2
        )
    `
    return database.lines(sql, [plan_id, type], true, viewport)
  }

  // View existing fiber plant for the current carrier
  static viewFiberPlantForCurrentCarrier (viewport) {
    var sql = 'SELECT geom FROM client.existing_fiber'
    return database.lines(sql, [], true, viewport)
  }

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

  static carriers (plan_id, fiberType, viewport) {
    var params = [fiberType]
    var sql
    if (!viewport) {
      sql = `
        SELECT carriers.id, carriers.name, carriers.color
          FROM carriers
           WHERE carriers.route_type=$1
           ${database.intersects(viewport, 'cb.geom', 'AND')}
         ORDER BY carriers.name ASC
      `
    } else {
      sql = `
      SELECT DISTINCT ON (carriers.name)
             carriers.id, carriers.name, carriers.color
        FROM carriers
        JOIN client.census_blocks_carriers cbc ON carriers.id = cbc.carrier_id
        JOIN census_blocks cb ON cbc.census_block_gid = cb.gid
       WHERE carriers.route_type=$1
         ${database.intersects(viewport, 'cb.geom', 'AND')}
         ORDER BY carriers.name ASC
      `
    }
    return database.query(sql, params)
  }

  // View the user client's network nodes
  //
  // 1. node_type String (ex. 'central_office', 'fiber_distribution_hub', 'fiber_distribution_terminal')
  // 2. plan_id Number Pass a plan_id to find additionally the network nodes associated to that route
  static viewNetworkNodes (node_types, plan_id, viewport, serviceLayer) {
    return Promise.resolve()
      .then(() => {
        var sql = `
          SELECT
            n.id, geom, t.name AS name,
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
          if (serviceLayer) {
            params.push(serviceLayer)
            constraints.push(`
              plan_id IN (
                SELECT p.id FROM client.plan p WHERE p.parent_plan_id IN (
                  SELECT p.id
                    FROM client.plan p
                    JOIN client.service_layer s ON s.id = p.service_layer_id AND s.id = $${params.length}
                    WHERE p.parent_plan_id = $${params.length - 1}
                )
              )
            `)
          } else {
            constraints.push(`
              (plan_id IS NULL OR plan_id IN (
                SELECT id FROM client.plan WHERE parent_plan_id=$${params.length}
                UNION ALL
                SELECT $${params.length}
              ))`)
          }
        } else {
          constraints.push('plan_id IS NULL')
        }

        if (constraints.length > 0) {
          sql += ' WHERE ' + constraints.join(' AND ')
        }
        return database.points(sql, params, true, viewport)
      })
  }

  // View all the available network node types
  static viewNetworkNodeTypes () {
    return database.query('SELECT * FROM client.network_node_types')
  }

  static viewServiceLayers () {
    return database.query('SELECT * FROM client.service_layer')
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

  static viewFiber (plan_id, serviceLayer) {
    var sql = `
      SELECT
        fiber_route.id,
        ST_AsGeoJSON(fiber_route.geom)::json AS geom,
        ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid,
        frt.name AS fiber_type,
        frt.description AS fiber_name
      FROM client.plan p
      JOIN client.fiber_route ON fiber_route.plan_id = p.id
      JOIN client.fiber_route_type frt ON frt.id = fiber_route.fiber_route_type
      WHERE p.id IN (
        SELECT p.id FROM client.plan p WHERE p.parent_plan_id IN (
          SELECT p.id
            FROM client.plan p
            JOIN client.service_layer s ON s.id = p.service_layer_id AND s.id = $${2}
            WHERE p.parent_plan_id = $${1}
        )
      )
    `
    return database.query(sql, [plan_id, serviceLayer], true)
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

  static recalculateNodes (plan_id, options) {
    console.log('options', options)
    var locationTypes = {
      households: 'household',
      businesses: ['medium', 'large'],
      towers: 'celltower',
      smb: 'small',
      '2kplus': 'mrcgte2000'
    }
    var algorithms = {
      'MAX_IRR': 'IRR',
      'TARGET_IRR': 'IRR',
      'BUDGET_IRR': 'IRR',
      'IRR': 'IRR'
    }
    options.algorithm = algorithms[options.algorithm] || options.algorithm
    options.locationTypes = Array.isArray(options.locationTypes) ? options.locationTypes : []
    var body = {
      planId: plan_id,
      locationTypes: _.compact(_.flatten(options.locationTypes.map((key) => locationTypes[key]))),
      algorithm: options.algorithm,
      analysisSelectionMode: options.selectionMode,
      processLayers: options.processingLayers
    }
    var req = {
      method: 'POST',
      url: `${config.aro_service_url}/rest/optimize/masterplan`,
      json: true,
      body: body
    }
    var financialConstraints = body.financialConstraints = { years: 10 }
    if (options.budget) financialConstraints.budget = options.budget
    if (options.discountRate) financialConstraints.discountRate = options.discountRate
    if (options.irrThreshold) body.threshold = options.irrThreshold
    return Promise.all([
      database.execute('DELETE FROM client.selected_regions WHERE plan_id = $1', [plan_id]),
      database.execute('DELETE FROM client.selected_service_area WHERE plan_id = $1', [plan_id])
    ])
    .then(() => {
      if (options.geographies) {
        var promises = []
        options.geographies.forEach((geography) => {
          var type = geography.type
          var id = geography.id
          var params = [plan_id, geography.name, id, type]
          var queries = {
            'census_blocks': '(SELECT geom FROM census_blocks WHERE id=$3::bigint)',
            'county_subdivisions': '(SELECT geom FROM cousub WHERE id=$3::bigint)',
            'cma_boundaries': '(SELECT the_geom FROM ref_boundaries.cma WHERE gid=$3::bigint)'
          }
          var query
          if (geography.geog) {
            params.push(JSON.stringify(geography.geog))
            query = `ST_GeomFromGeoJSON($${params.length})`
          } else {
            query = queries[type]
            if (!query) {
              params.push(type)
              query = `
                (
                  SELECT geom
                  FROM client.service_area
                  JOIN client.service_layer
                    ON service_area.service_layer_id = service_layer.id
                  AND service_layer.name=$${params.length}
                  WHERE service_area.id=$3::bigint
                )
              `
              promises.push(
                database.execute(`
                  INSERT INTO client.selected_service_area (
                    plan_id, service_area_id
                  ) VALUES ($1, $2)
                `, [plan_id, id])
              )
            }
          }
          promises.push(database.execute(`
            INSERT INTO client.selected_regions (
              plan_id, region_name, region_id, region_type, geom
            ) VALUES ($1, $2, $3, $4, ${query})
          `, params))
        })
        return Promise.all(promises)
      }
    })
    .then(() => this._callService(req))
    .then(() => ({}))
  }

  static planSummary (plan_id) {
    var req = {
      url: config.aro_service_url + `/rest/report/plan/${plan_id}`,
      json: true
    }
    return this._callService(req)
  }

  static irrAndNpv (plan_id) {
    var req = {
      url: config.aro_service_url + `/rest/roic/models/${plan_id}`,
      qs: { '$select': 'incremental.network.cashflow' },
      json: true
    }
    return this._callService(req)
      .then((result) => {
        var arr = result[0].values
        // NPV = CF0 / (1+.08)^0 + CF1 / (1.08)^1 + CF2 / (1.08)^2 ..... + CFn / (1.08)^n
        var i = 0
        var npv = arr.reduce((total, value) => total + value / Math.pow(1.08, i++), 0)
        var irr = helpers.irr(arr)
        return { npv: npv, irr: irr }
      })
  }

  static _callService (req) {
    return models.AROService.request(req)
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

  static searchBoundaries (text, types, viewport) {
    var parts = []
    var limit = 20
    var params = [`%${text}%`]

    types.forEach((type) => {
      if (type === 'cma_boundaries') {
        parts.push(`
          SELECT 'cma_boundary:' || gid AS id, name, ST_AsGeoJSON(the_geom)::json AS geog
          FROM ref_boundaries.cma LIMIT ${limit}
        `)
      } else if (type === 'county_subdivision') {
        parts.push(`
          SELECT 'county:' || gid AS id, name, ST_AsGeoJSON(geom)::json AS geog
            FROM aro.cousub
           WHERE lower(unaccent(name)) LIKE lower(unaccent($1))
                 ${database.intersects(viewport, 'geom', 'AND')}
                 LIMIT ${limit}
          `)
      } else if (type === 'census_blocks') {
        parts.push(`
          SELECT 'census_block:' || gid AS id, name, ST_AsGeoJSON(geom)::json AS geog
            FROM census_blocks
           WHERE lower(unaccent(name)) LIKE lower(unaccent($1))
                 ${database.intersects(viewport, 'geom', 'AND')}
                 LIMIT ${limit}
          `)
      } else {
        params.push(type)
        parts.push(`
          SELECT $${params.length} || ':' || service_area.id AS id, code AS name, ST_AsGeoJSON(geom)::json AS geog
            FROM client.service_area
            JOIN client.service_layer
              ON service_area.service_layer_id = service_layer.id
            AND service_layer.name=$${params.length}
          WHERE lower(unaccent(code)) LIKE lower(unaccent($1))
                ${database.intersects(viewport, 'geom', 'AND')}
                LIMIT ${limit}
          `)
      }
    })

    if (parts.length === 0) {
      return Promise.resolve([])
    }

    var sql = parts.map((sql) => `(${sql})`).join(' UNION ALL ')
    return database.query(sql, params)
  }

  static importLocations (plan_id, file) {
    return new Promise((resolve, reject) => {
      var found = 0
      var notFound = 0
      var errors = 0
      var headers = false
      var latColumn = -1
      var lonColumn = -1

      var parser = parse()
      var input = fs.createReadStream(file)
      var transformer = transform((record, callback) => {
        var empty = record.every((item) => item === '')
        if (empty) return callback()

        if (!headers) {
          record.forEach((value, i) => {
            value = value.toLowerCase().trim()
            if (value === 'lat' || value === 'latitude') {
              latColumn = i
            } else if (value === 'lon' || value === 'lng' || value === 'longitude') {
              lonColumn = i
            }
            if (latColumn >= 0 && lonColumn >= 0) {
              headers = true
            }
          })
          return callback()
        }

        var lat = +record[latColumn]
        var lon = +record[lonColumn]
        if (!lat || !lon) { // we don't accept zeros, either
          errors++
          return callback()
        }
        var sql = `
          WITH locations AS (
            SELECT id AS location_id, $1::bigint as plan_id
            FROM locations WHERE ST_Equals(ST_SetSRID(ST_MakePoint($3::float8, $2::float8), 4326), geom) LIMIT 1
          ),

          deleted AS (
            DELETE FROM client.plan_targets WHERE location_id IN (SELECT location_id FROM locations) AND plan_id=$1
          )

          INSERT INTO client.plan_targets (location_id, plan_id) (SELECT location_id, plan_id FROM locations)
        `
        database.execute(sql, [plan_id, lat, lon])
          .then((rows) => {
            if (rows === 0) notFound++
            else found++
            return callback()
          })
          .catch((err) => {
            console.log('err', err)
            errors++
            return callback()
          })
      }, { parallel: 10 }, () => {
        resolve({ found: found, notFound: notFound, errors: errors })
      })
      input.pipe(parser).pipe(transformer)
      transformer.on('error', reject)
    })
  }

}
