// Network
//
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var cache = helpers.cache
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
        WHERE fr.plan_id IN (
          (SELECT p.id FROM client.plan p WHERE p.parent_plan_id IN (
            (SELECT id FROM client.plan WHERE parent_plan_id=$1)
          ))
        )
        AND seg.cable_construction_type_id = (
          SELECT id FROM client.cable_construction_type WHERE name=$2
        )
        ${database.intersects(viewport, 'seg.geom', 'AND')}
    `
    return database.lines(sql, [plan_id, type], true, viewport)
  }

  // View existing fiber plant for the current carrier
  static viewFiberPlantForCurrentCarrier (viewport) {
    var sql = `
      SELECT geom FROM client.existing_fiber
      ${database.intersects(viewport, 'geom', 'WHERE')}
    `
    return database.lines(sql, [], true, viewport)
  }

  // View existing fiber plant for a carrier
  static viewFiberPlantForCarrier (carrier_name, viewport) {
    var sql = `
      SELECT geom
      FROM aro.fiber_plant
      WHERE carrier_name = $1
      ${database.intersects(viewport, 'geom', 'AND')}
    `
    return database.lines(sql, [carrier_name], true, viewport)
  }

  // View existing fiber plant for competitors
  static viewFiberPlantForCompetitors (viewport) {
    var sql = `
      SELECT geom
      FROM aro.fiber_plant
      WHERE carrier_id <> (SELECT id FROM carriers WHERE name=$1)
      ${database.intersects(viewport, 'geom', 'AND')}
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
    if (fiberType === 'fiber') {
      sql = `
        WITH visible_carriers AS (SELECT c.*
          FROM carriers c
          JOIN fiber_plant fp ON fp.carrier_id = c.id
          ${database.intersects(viewport, 'fp.geom', 'AND')}
          WHERE c.route_type=$1
          GROUP BY c.id
        )

        SELECT carriers.id, carriers.name, carriers.color
        FROM visible_carriers carriers
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
            n.plan_id,
            -- plan_id IS NOT NULL AS draggable,
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
            arr.push('t.id = $' + params.length)
          })
          constraints.push('(' + arr.join(' OR ') + ')')
        }

        if (plan_id) {
          if (serviceLayer) {
            if (serviceLayer === 'all') {
              params.push(plan_id)
              constraints.push(`
                plan_id IN (
                  SELECT p.id FROM client.plan p WHERE p.parent_plan_id IN (
                    SELECT p.id
                      FROM client.plan p
                      -- JOIN client.service_layer s ON s.id = p.service_layer_id
                      WHERE p.parent_plan_id = $${params.length}
                  )
                )
              `)
            } else {
              params.push(serviceLayer)
              constraints.push(`
                plan_id IN (
                  SELECT p.id FROM client.plan p
                  JOIN client.service_layer s ON s.id = p.service_layer_id AND s.id = $${params.length}
                  WHERE p.plan_type = 'H'
                )
              `)
            }
          } else {
            params.push(plan_id)
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
          sql += ` WHERE ${constraints.join(' AND ')} ${database.intersects(viewport, 'geom', 'AND')}`
        } else {
          sql += database.intersects(viewport, 'geom', 'WHERE')
        }
        return database.points(sql, params, true, viewport)
      })
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

  static viewFiber (plan_id, serviceLayer, viewport) {
    var params = []
    var condition = ''
    if (serviceLayer === 'all') {
      params.push(plan_id)
      condition = `
        SELECT p.id FROM client.plan p WHERE p.parent_plan_id IN (
          SELECT p.id
            FROM client.plan p
            -- JOIN client.service_layer s ON s.id = p.service_layer_id
            WHERE p.parent_plan_id = $1
        )
      `
    } else {
      if (+serviceLayer !== serviceLayer) {
        return Promise.resolve([])
      }
      params.push(serviceLayer)
      condition = `
        SELECT p.id FROM client.plan p
        JOIN client.service_layer s ON s.id = p.service_layer_id AND s.id = $1
        WHERE p.plan_type = 'H'
      `
    }
    var sql = `
      SELECT
        fiber_route.id,
        fiber_route.geom AS geom,
        ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid,
        frt.name AS fiber_type,
        frt.description AS fiber_name
      FROM client.plan p
      JOIN client.fiber_route ON fiber_route.plan_id = p.id
      JOIN client.fiber_route_type frt ON frt.id = fiber_route.fiber_route_type
      WHERE p.id IN (${condition})
      AND NOT ST_IsEmpty(fiber_route.geom)
      ${database.intersects(viewport, 'fiber_route.geom', 'AND')}
    `
    return database.lines(sql, params, true, viewport)
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
    var algorithms = {
      'MAX_IRR': 'IRR',
      'TARGET_IRR': 'IRR',
      'BUDGET_IRR': 'IRR',
      'IRR': 'IRR',
      'TABC': 'CUSTOM'
    }
    options.algorithm = algorithms[options.algorithm] || options.algorithm
    options.locationTypes = Array.isArray(options.locationTypes) ? options.locationTypes : []
    var body = {
      planId: plan_id,
      locationTypes: options.locationTypes,
      algorithm: options.algorithm,
      analysisSelectionMode: options.selectionMode,
      fiberNetworkConstraints: options.fiberNetworkConstraints,
      processLayers: options.processingLayers,
      customOptimization: options.customOptimization,
      entityDataSources: options.entityDataSources
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
      database.execute('DELETE FROM client.selected_service_area WHERE plan_id = $1', [plan_id]),
      database.execute('DELETE FROM client.selected_analysis_area WHERE plan_id = $1', [plan_id]),
      database.execute('UPDATE client.plan SET location_types=ARRAY[$2]::varchar[] WHERE id=$1', [plan_id, options.locationTypes])
    ])
    .then(() => {
      if (options.geographies) {
        var promises = []
        options.geographies.forEach((geography) => {
          var type = geography.type
          var id = geography.id
          var params = [plan_id, geography.name, id, type, geography.layerId || null]
          var queries = {
            'census_blocks': '(SELECT geom FROM census_blocks WHERE id=$3::bigint)',
            'county_subdivisions': '(SELECT geom FROM cousub WHERE gid=$3::bigint)'
          }
          var isAnalysisLayer = cache.analysisLayers.find((layer) => layer.name === type)
          var isServiceLayer = cache.serviceLayers.find((layer) => layer.name === type) || geography.layerId
          var query
          if (isAnalysisLayer) {
            params.push(type)
            query = `
              (
                SELECT geom
                FROM client.analysis_area
                JOIN client.analysis_layer
                  ON analysis_area.analysis_layer_id = analysis_layer.id
                AND analysis_layer.name=$${params.length}
                WHERE analysis_area.id=$3::bigint
              )
            `
            promises.push(
              database.execute(`
                INSERT INTO client.selected_analysis_area (
                  plan_id, analysis_area_id
                ) VALUES ($1, $2)
              `, [plan_id, id])
            )
          } else if (isServiceLayer) {
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
          } else if (geography.geog) {
            params.push(JSON.stringify(geography.geog))
            query = `ST_GeomFromGeoJSON($${params.length})`
          } else {
            query = queries[type]
          }
          promises.push(database.execute(`
            INSERT INTO client.selected_regions (
              plan_id, region_name, region_id, region_type, layer_id, geom
            ) VALUES ($1, $2, $3, $4, $5, ${query})
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
      if (type === 'county_subdivision') {
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
        var isAnalysisLayer = cache.analysisLayers.find((layer) => layer.name === type)
        var isServiceLayer = cache.serviceLayers.find((layer) => layer.name === type)
        if (isServiceLayer) {
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
        } else if (isAnalysisLayer) {
          params.push(type)
          parts.push(`
            SELECT $${params.length} || ':' || analysis_area.id AS id, code AS name, ST_AsGeoJSON(geom)::json AS geog
              FROM client.analysis_area
              JOIN client.analysis_layer
                ON analysis_area.analysis_layer_id = analysis_layer.id
              AND analysis_layer.name=$${params.length}
            WHERE lower(unaccent(code)) LIKE lower(unaccent($1))
                  ${database.intersects(viewport, 'geom', 'AND')}
                  LIMIT ${limit}
            `)
        } else {
          console.warn('Unknown boundary type', type)
        }
      }
    })

    if (parts.length === 0) {
      return Promise.resolve([])
    }

    var sql = parts.map((sql) => `(${sql})`).join(' UNION ALL ')
    return database.query(sql, params)
  }

  static importLocationsByCoordinates (plan_id, file) {
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

  static importLocationsByIds (plan_id, file) {
    return new Promise((resolve, reject) => {
      var errors = 0
      var ids = []

      var parser = parse()
      var input = fs.createReadStream(file)
      var transformer = transform((record, callback) => {
        var empty = record.every((item) => item === '')
        if (empty) return callback()

        var id = record[0]
        if (id != +id) { // eslint-disable-line
          errors++
          return callback()
        }
        ids.push(+id)
        callback()
      }, { parallel: 1 }, () => {
        if (ids.length === 0) return resolve({ found: 0, notFound: 0, errors: errors })
        database.execute('DELETE FROM client.plan_targets WHERE plan_id = $1 AND location_id IN ($2)', [plan_id, ids])
          .then(() => {
            var params = [plan_id]
            var sql = `
              INSERT INTO client.plan_targets (plan_id, location_id) VALUES
                ${ids.map((id) => `($1, $${params.push(id) || params.length})`)}
            `
            return database.execute(sql, params)
          })
          .then((rows) => {
            resolve({
              found: rows,
              notFound: ids.length - rows,
              errors: errors
            })
          })
          .catch(reject)
      })
      input.pipe(parser).pipe(transformer)
      transformer.on('error', reject)
    })
  }

  static roadSegments (viewport) {
    return database.lines(`
      SELECT geom, gid, tlid FROM edges
      ${database.intersects(viewport, 'geom', 'WHERE')}
    `, [], true, viewport)
  }

  static backhaulLinks (plan_id) {
    return database.query(`
      SELECT
        nn1.plan_id AS plan_id,
        plan_links.from_link_id,
        plan_links.to_link_id,
        ST_AsGeoJSON(nn1.geom)::json AS from_geom,
        ST_AsGeoJSON(nn2.geom)::json AS to_geom
      FROM client.plan_links
      JOIN client.network_nodes nn1 ON nn1.id = plan_links.from_link_id
      JOIN client.network_nodes nn2 ON nn2.id = plan_links.to_link_id
      WHERE plan_links.plan_id = $1
    `, [plan_id])
  }

  static saveBackhaulLinks (plan_id, fromIds, toIds) {
    if (fromIds.length !== toIds.length) {
      return Promise.reject(new Error('fromIds and toIds should have the same length'))
    }
    return database.execute('DELETE FROM client.plan_links WHERE client.plan_links.plan_id = $1', [plan_id])
      .then(() => {
        var i = 0
        return pync.series(fromIds, (id) => {
          var params = [id, toIds[i++], plan_id]
          return database.execute('INSERT INTO client.plan_links (from_link_id, to_link_id, plan_id) VALUES ($1, $2, $3)', params)
        })
      })
  }

}
