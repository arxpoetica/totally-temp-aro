// Network plan
//
// The Route Optimizer finds shortest paths between sources and targets

'use strict'

var helpers = require('../helpers')
var config = helpers.config
var database = helpers.database
var validate = helpers.validate
var cache = helpers.cache
var models = require('./')
var _ = require('underscore')
var pync = require('pync')
var pify = require('pify')
var request = pify(require('request'), { multiArgs: true })
const { createLogger, LOGGER_GROUPS } = require('../helpers/logger')
const logger = createLogger(LOGGER_GROUPS.MODELS)

// NOTE: this extra functionality is when count limits are large
// hence smaller limited sync calls instead of one massive
const CHUNK_LIMIT = 10000
function breakArrayIntoChunks(array, limit = CHUNK_LIMIT) {
  const arrayOfChunks = []
  for (let index = 0; index < array.length; index += limit) {
      const chunk = array.slice(index, index + limit)
      arrayOfChunks.push(chunk)
  }
  return arrayOfChunks
}

module.exports = class NetworkPlan {

  static _addSources (plan_id, network_node_ids) {
    if (!_.isArray(network_node_ids) || network_node_ids.length === 0) return Promise.resolve()

    return Promise.resolve()
      .then(() => {
        // avoid duplicates
        var sql = `
          DELETE FROM client.plan_sources
          WHERE plan_id=$1 AND network_node_id IN ($2)
        `
        return database.execute(sql, [plan_id, network_node_ids])
      })
      .then(() => {
        // calculate closest vertex
        // TODO: simplify
        var sql = `
          INSERT INTO client.plan_sources (network_node_id, plan_id)
          (SELECT network_nodes.id, $2
            FROM client.network_nodes
            WHERE network_nodes.id IN ($1))
        `
        return database.execute(sql, [network_node_ids, plan_id])
      })
  }

  static async addTargets (plan_id, location_ids) {
    if (!_.isArray(location_ids) || location_ids.length === 0) return Promise.resolve()

    const locationIdChunks = breakArrayIntoChunks(location_ids)
    for (const locationIdsChunk of locationIdChunks) {
      var sql = `
        INSERT INTO client.plan_targets(location_id, plan_id)
        (
          SELECT id, $2
          FROM locations
          WHERE id IN ($1)
          AND id NOT IN (SELECT location_id FROM client.plan_targets WHERE plan_id=$2)  -- We don't want duplicate targets
        )
      `
      await database.query(sql, [locationIdsChunk, plan_id])
    }
    return Promise.resolve()
  }

  static async removeTargets (plan_id, location_ids) {
    if (!_.isArray(location_ids) || location_ids.length === 0) return Promise.resolve()

    const locationIdChunks = breakArrayIntoChunks(location_ids)
    for (const locationIdsChunk of locationIdChunks) {
      const sql = `
        DELETE FROM client.plan_targets
        WHERE location_id in ($1)
        AND plan_id = $2
      `
      await database.query(sql, [locationIdsChunk, plan_id])
    }
    return Promise.resolve()
  }

  static removeAllTargets (plan_id) {
    const sql = 'DELETE FROM client.plan_targets WHERE plan_id=$1'
    return database.query(sql, [plan_id])
  }

  static async getTargetsAddresses (locationIds) {
    if (!_.isArray(locationIds) || locationIds.length === 0) return Promise.resolve()

    // returning keyed object instead of array of results
    const idToLocation = {}
    const locationIdChunks = breakArrayIntoChunks(locationIds)
    for (const locationIdsChunk of locationIdChunks) {
      const sql = `
        SELECT id, object_id, INITCAP(address) as address,ST_X(geom) as lng, ST_Y(geom) as lat
        FROM location_entity
        WHERE object_id IN ($1)
      `
      const result = await database.query(sql, [locationIdsChunk])
      result.forEach(location => idToLocation[location.object_id] = location)
    }
    return idToLocation
  }

  static getServiceAreaAddresses (serviceAreaIds) {
    if (!_.isArray(serviceAreaIds) || serviceAreaIds.length === 0) return Promise.resolve()

    var sql = `
      SELECT id, code
      FROM client.service_area
      WHERE id IN ($1)
    `
    return database.query(sql, [serviceAreaIds])
      .then(result => {
        // Convert array to a keyed object, then return it.
        var idToServiceArea = {}
        result.forEach(serviceArea => idToServiceArea[serviceArea.id] = serviceArea)
        return idToServiceArea
      })
}

  static getAnalysisAreaAddresses (analysisAreaIds) {
    if (!_.isArray(analysisAreaIds) || analysisAreaIds.length === 0) return Promise.resolve()

    var sql = `
      SELECT id, analysis_layer_id, code
      FROM client.analysis_area
      WHERE id IN ($1)
    `
    return database.query(sql, [analysisAreaIds])
      .then(result => {
        // Convert array to a keyed object, then return it.
        var idToAnalysisArea = {}
        result.forEach(analysisArea => idToAnalysisArea[analysisArea.id] = analysisArea)
        return idToAnalysisArea
      })
}

  static _deleteSources (plan_id, network_node_ids) {
    if (!_.isArray(network_node_ids) || network_node_ids.length === 0) return Promise.resolve()

    return pync.series(network_node_ids, (network_node_id) => {
      var sql = `
        DELETE FROM client.plan_sources
        WHERE plan_id=$1 AND network_node_id=$2
      `
      return database.execute(sql, [plan_id, network_node_id])
    })
  }

  static copyPlan (plan_id, name, user) {
    return database.findOne(`
      INSERT INTO client.active_plan (name, area_name, area_centroid, area_bounds, created_at, updated_at, plan_type, location_types, optimization_type)
      SELECT
        $2 AS name,
        area_name,
        area_centroid,
        area_bounds,
        NOW() AS created_at,
        NOW() AS updated_at,
        'R' AS plan_type,
        location_types,
        optimization_type
      FROM client.active_plan WHERE id=$1
      RETURNING id
    `, [plan_id, name])
    .then((plan) => {
      var id = plan.id
      return Promise.all([
        database.execute(`
          INSERT INTO client.selected_regions (plan_id, region_name, region_id, region_type)
          SELECT $2 AS plan_id, region_name, region_id, region_type FROM client.selected_regions WHERE plan_id = $1
        `, [plan_id, id]),
        database.execute(`
          INSERT INTO client.selected_service_area (plan_id, service_area_id)
          SELECT $2 AS plan_id, service_area_id FROM client.selected_service_area WHERE plan_id = $1
        `, [plan_id, id]),
        database.execute(`
          INSERT INTO client.selected_analysis_area (plan_id, analysis_area_id)
          SELECT $2 AS plan_id, analysis_area_id FROM client.selected_analysis_area WHERE plan_id = $1
        `, [plan_id, id]),
        database.execute(`
          INSERT INTO client.plan_sources (plan_id, network_node_id)
          SELECT $2 AS plan_id, network_node_id FROM client.plan_sources WHERE plan_id = $1
        `, [plan_id, id]),
        database.execute(`
          INSERT INTO client.plan_targets (plan_id, location_id)
          SELECT $2 AS plan_id, location_id FROM client.plan_targets WHERE plan_id = $1
        `, [plan_id, id])
      ])
      .then(() => models.Permission.grantAccess(id, user.id, 'owner'))
      .then(() => {
        var sql = `
          SELECT
            plan.id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds,
            users.id as owner_id, users.first_name as owner_first_name, users.last_name as owner_last_name,
            created_at, updated_at
          FROM
            client.active_plan plan
          LEFT JOIN auth.permissions ON permissions.plan_id = plan.id AND permissions.rol = 'owner'
          LEFT JOIN auth.users ON users.id = permissions.user_id
          WHERE plan.id=$1
        `
        return database.findOne(sql, [id])
      })
    })
  }

  static findPlan (plan_id, metadata_only) {
    var output = {
      'feature_collection': {
        'type': 'FeatureCollection'
      },
      'metadata': { costs: [] }
    }
    var plan

    return database.findOne(`
        SELECT
          plan.id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds,
          users.id as owner_id, users.first_name as owner_first_name, users.last_name as owner_last_name,
          created_at, updated_at, location_types, optimization_type,
          (SELECT EXISTS(SELECT id FROM client.active_plan WHERE parent_plan_id=$1 LIMIT 1)) AS "ranOptimization"
        FROM client.active_plan plan
        LEFT JOIN auth.permissions ON permissions.plan_id = plan.id AND permissions.rol = 'owner'
        LEFT JOIN auth.users ON users.id = permissions.user_id
        WHERE plan.id=$1
      `, [plan_id])
      .then((_plan) => {
        if (!_plan) return Promise.reject(new Error('Plan not found'))

        plan = _plan
        Object.keys(plan).forEach((key) => {
          output[key] = plan[key]
        })

        return models.Network.planSummary(plan_id)
      })
      .then((summary) => {
        summary.networkStatistics = Array.isArray(summary.networkStatistics) ? summary.networkStatistics : []
        var npv = summary.networkStatistics.find((stat) => stat.networkStatisticType === 'roic_npv') ||
                  summary.networkStatistics.find((stat) => stat.networkStatisticType === 'npv')
        var irr = summary.networkStatistics.find((stat) => stat.networkStatisticType === 'roic_irr') ||
                  summary.networkStatistics.find((stat) => stat.networkStatisticType === 'irr')

        output.metadata.npv = npv && npv.value
        output.metadata.irr = irr && irr.value

        var priceModel = summary.priceModel || {}
        var fiberCosts = Array.isArray(priceModel.fiberCosts) ? priceModel.fiberCosts : []

        var demandSummary = summary.demandSummary || {}
        var networkDemands = Array.isArray(demandSummary.networkDemands) ? demandSummary.networkDemands : []

        var cableConstructionTypes = [
          { name: 'aerial', description: 'Aerial' },
          { name: 'buried', description: 'Buried' },
          { name: 'underground', description: 'Underground' },
          { name: 'obstacle', description: 'Obstacle' },
          { name: 'conduit', description: 'Conduit' },
          { name: 'estimated', description: 'Estimated' },
          { name: 'planned_conduit', description: 'Planned Conduit' }
        ]

        output.metadata.fiberTotals = { types: {}, totalLength: 0, totalCost: 0 }
        var fiberTypes = ['distribution', 'feeder', 'backbone']
        fiberTypes.forEach((fiberType) => {
          output.metadata.fiberTotals.types[fiberType] = { totalLength: 0, totalCost: 0 }
        })
        output.metadata.fiberDetails = cableConstructionTypes.map((type) => {
          var obj = { types: {}, totalLength: 0, totalCost: 0, description: type.description, name: type.name }
          fiberTypes.forEach((fiberType) => {
            obj.types[fiberType] = { totalLength: 0, totalCost: 0 }
          })
          fiberCosts.filter((cost) => cost.constructionType === type.name)
            .forEach((cost) => {
              if (!obj.types[cost.fiberType]) return
              obj.types[cost.fiberType].totalLength += cost.lengthMeters
              obj.types[cost.fiberType].totalCost += cost.totalCost
              obj.totalLength += cost.lengthMeters
              obj.totalCost += cost.totalCost

              output.metadata.fiberTotals.types[cost.fiberType].totalLength += cost.lengthMeters
              output.metadata.fiberTotals.types[cost.fiberType].totalCost += cost.totalCost
              output.metadata.fiberTotals.totalLength += cost.lengthMeters
              output.metadata.fiberTotals.totalCost += cost.totalCost
            })
          return obj
        })

        var equipmentCosts = priceModel.equipmentCosts || []
        output.metadata.equipment_summary = equipmentCosts.map((item) => {
          return {
            totalCost: item.total,
            description: item.nodeType,
            quantity: item.quantity
          }
        })

        var groupedFiberCosts = _.groupBy(fiberCosts, 'fiberType')
        output.metadata.fiber_summary = Object.keys(groupedFiberCosts).map((fiberTypeKey) => {
          var arr = groupedFiberCosts[fiberTypeKey]
          var fiberType = cache.fiberTypes.find((i) => i.name === fiberTypeKey)
          return {
            lengthMeters: arr.reduce((total, item) => total + item.lengthMeters, 0),
            totalCost: arr.reduce((total, item) => total + item.costPerMeter * item.lengthMeters, 0),
            description: (fiberType && fiberType.description) || fiberTypeKey
          }
        })

        output.metadata.equipment_cost = output.metadata.equipment_summary.reduce((total, item) => item.totalCost + total, 0)
        output.metadata.fiber_cost = output.metadata.fiber_summary.reduce((total, item) => item.totalCost + total, 0)
        output.metadata.fiber_length = output.metadata.fiber_summary.reduce((total, item) => item.lengthMeters + total, 0)

        plan.total_cost = output.metadata.equipment_cost + output.metadata.fiber_cost

        var demand = networkDemands.find((item) => item.demandType === 'planned_demand')
        var locationDemand = (demand && demand.locationDemand) || {}
        var entityDemands = locationDemand.entityDemands || {}
        output.metadata.premises = Object.keys(entityDemands).map((key) => {
          var entityName = entityNames.find((i) => i.name === key)
          return {
            name: (entityName && entityName.description) || key,
            value: entityDemands[key].rawCoverage
          }
        })
        // plan.total_revenue = demand.locationDemand.totalRevenue

        output.metadata.total_premises = output.metadata.premises.reduce((total, item) => total + item.value, 0)

        return database.query(`
          SELECT
            region_id AS id,
            region_name AS name,
            region_type AS type,
            layer_id AS "layerId",
            ST_AsGeoJSON(geom)::json AS geog
          FROM client.selected_regions WHERE plan_id = $1
        `, [plan_id])
      })
      .then((selectedRegions) => {
        output.metadata.selectedRegions = selectedRegions
        return models.CustomerProfile.customerProfileByEntity(plan_id)
      })
      .then((customerTypes) => {
        plan.total_revenue = plan.total_revenue || 0
        plan.total_cost = plan.total_cost || 0
        output.metadata.revenue = plan.total_revenue
        output.metadata.total_cost = plan.total_cost || 0
        output.metadata.profit = output.metadata.revenue - output.metadata.total_cost
        output.metadata.customerTypes = customerTypes

        database.execute(`
            UPDATE client.active_plan SET
              total_cost=$2,
              total_revenue=$3,
              npv=$4,
              irr=$5,
              fiber_length=$6
            WHERE id=$1
          `, [
            plan_id,
            plan.total_cost,
            output.metadata.revenue,
            output.metadata.npv,
            +output.metadata.irr || null,
            output.metadata.fiber_summary.reduce((total, item) => total + item.lengthMeters * 0.000621371, 0)
          ])
          .catch((err) => {
            logger.error(err)
          })

        if (metadata_only) delete output.feature_collection
        return output
      })
  }

  static findWirecenterPlan (plan_id, wirecenter_id) {
    var params = [plan_id, wirecenter_id]
    return database.findOne(`
        SELECT id FROM client.active_plan WHERE parent_plan_id IN (SELECT id from client.active_plan WHERE parent_plan_id=$1)
        AND wirecenter_id=$2
      `, params)
      .then((row) => {
        if (!row) return {}
        return this.findPlan(row.id, true)
      })
  }

  static findChildPlans (plan_id, viewport) {
    var params = [plan_id]
    return database.polygons(`
      SELECT p.wirecenter_id AS id, sa.geom AS geom, sa.code AS name, ST_AsGeoJSON(ST_Centroid(sa.geom))::json AS centroid
        FROM client.active_plan p
        JOIN client.service_layer sl ON p.service_layer_id = sl.id
        JOIN client.service_area sa ON p.wirecenter_id = sa.id
        WHERE plan_type='W' AND parent_plan_id IN (SELECT id from client.active_plan WHERE parent_plan_id=$1)
        ${database.intersects(viewport, 'geom', 'AND')}
    `, params, true, viewport)
  }

  static findAll (user, options) {
    var text = options.text
    var sortField = options.sortField
    var sortOrder = options.sortOrder
    var page = options.page || 1
    var minimumCost = options.minimumCost
    var maximumCost = options.maximumCost

    var numPlansPerPage = 8
    var sortFields = [
      'name', 'created_at', 'updated_at',
      'total_cost', 'total_revenue', 'irr', 'npv', 'fiber_length'
    ]
    var sortOrders = ['ASC', 'DESC']
    if (sortFields.indexOf(sortField) === -1) sortField = sortFields[0]
    if (sortOrders.indexOf(sortOrder) === -1) sortOrder = sortOrders[0]
    sortField = 'plan.' + sortField

    return Promise.resolve()
      .then(() => {
        var sql = `
          SELECT
            plan.*,
            plan.id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds,
            users.id as owner_id, users.first_name as owner_first_name, users.last_name as owner_last_name,
            created_at, updated_at,
            (SELECT EXISTS(SELECT id FROM client.active_plan p WHERE parent_plan_id=plan.id LIMIT 1)) AS "ranOptimization"
          FROM client.active_plan plan
          LEFT JOIN auth.permissions ON permissions.plan_id = plan.id AND permissions.rol = 'owner'
          LEFT JOIN auth.users ON users.id = permissions.user_id
          WHERE plan.plan_type='R'
        `
        var params = []
        var allPlans = user && (user.perspective === 'admin' || user.perspective === 'sales') && options.allPlans
        if (user && !allPlans) {
          params.push(user.id)
          sql += ` AND plan.id IN (SELECT plan_id FROM auth.permissions WHERE user_id=$${params.length})`
        }
        if (text) {
          params.push(`%${text}%`)
          sql += ` AND (
            lower(name) LIKE lower($${params.length})
            OR lower(users.first_name) LIKE lower($${params.length})
            OR lower(users.last_name) LIKE lower($${params.length})
            OR plan.id IN (
              SELECT plan.id
                FROM client.active_plan plan
                JOIN client.selected_regions sr
                  ON sr.plan_id = plan.id
                 AND lower(sr.region_name) LIKE lower($${params.length})
            )
          )`
        }
        if (minimumCost || minimumCost === 0) {
          params.push(minimumCost)
          sql += ` AND total_cost >= $${params.length}`
        }
        if (maximumCost || maximumCost === 0) {
          params.push(maximumCost)
          sql += ` AND total_cost <= $${params.length}`
        }
        sql += ` ORDER BY ${sortField} ${sortOrder} LIMIT ${numPlansPerPage} OFFSET ${(page - 1) * numPlansPerPage}`
        return database.query(sql, params)
      })
      .then((plans) => {
        var params = []
        var sql = 'SELECT COUNT(*) AS count from client.active_plan plan'
        if (user) {
          sql += ' WHERE plan.id IN (SELECT plan_id FROM auth.permissions WHERE user_id=$1)'
          params.push(user.id)
        }
        return database.findOne(sql, params)
          .then((result) => {
            var count = result.count
            var pages = []
            var i = 0
            while (i * numPlansPerPage < count) {
              i++
              pages.push(i)
            }
            return {
              plans, pages
            }
          })
      })
  }

  static createPlan (name, area, user) {
    var id

    return validate((expect) => {
      expect(area, 'area', 'object')
      // area name?
      expect(area, 'area.centroid', 'object')
      expect(area, 'area.bounds', 'object')
    })
    .then(() => {
      var sql = `
        INSERT INTO client.active_plan (name, area_name, area_centroid, area_bounds, created_at, updated_at, plan_type)
        VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3::text), 4326), ST_Envelope(ST_SetSRID(ST_GeomFromGeoJSON($4::text), 4326)), NOW(), NOW(), 'R') RETURNING id;
      `
      var params = [
        name,
        area.name,
        JSON.stringify(area.centroid),
        JSON.stringify(area.bounds)
      ]
      return database.findOne(sql, params)
    })
    .then((row) => {
      id = row.id
      if (user) return models.Permission.grantAccess(id, user.id, 'owner')
    })
    .then(() => {
      var sql = `
        INSERT INTO client.plan_sources (network_node_id, plan_id)
        (SELECT network_nodes.id, $1 AS plan_id
          FROM client.network_nodes
          JOIN client.network_node_types nnt
            ON nnt.name = 'central_office'
           AND network_nodes.node_type_id = nnt.id
          JOIN client.active_plan plan
            ON plan.id = $1
      ORDER BY plan.area_bounds <#> network_nodes.geom LIMIT 1)
      `
      return database.execute(sql, [id])
    })
    .then(() => {
      var sql = `
        SELECT
          plan.id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds,
          users.id as owner_id, users.first_name as owner_first_name, users.last_name as owner_last_name,
          created_at, updated_at
        FROM
          client.active_plan plan
        LEFT JOIN auth.permissions ON permissions.plan_id = plan.id AND permissions.rol = 'owner'
        LEFT JOIN auth.users ON users.id = permissions.user_id
        WHERE plan.id=$1
      `
      return database.findOne(sql, [id])
    })
  }

  static deletePlan (userId, plan_id) {
    var req = {
      method: 'DELETE',
      url: `${config.aro_service_url}/user/${userId}/plan/${plan_id}`
    }
    return this._callService(req)
  }

  static clearRoute (userId, plan_id) {
    return Promise.resolve()
      .then(() => (
        database.execute('DELETE FROM client.plan_targets WHERE plan_id=$1', [plan_id])
      ))
      .then(() => (
        database.execute('DELETE FROM client.plan_sources WHERE plan_id=$1', [plan_id])
      ))
      .then(() => {
        var sql = `
          DELETE
          FROM client.subnet_link s
          WHERE id in (
            SELECT s.id
            FROM client.subnet_link s
            JOIN client.plan_subnet p
            ON s.plan_subnet_id = p.id
              AND p.plan_id IN (SELECT id FROM client.plan
                                WHERE parent_plan_id IN (SELECT id FROM client.plan WHERE parent_plan_id=${plan_id})))
        `
        return database.execute(sql)
        // database.execute('DELETE FROM client.fiber_route WHERE plan_id=$1', [plan_id])
      })
      .then(() => (
        database.execute('DELETE FROM client.network_nodes WHERE plan_id=$1', [plan_id])
      ))
  }

  static savePlan (plan_id, data) {
    var fields = []
    var params = []
    var allowed_fields = ['name']
    _.intersection(_.keys(data), allowed_fields).forEach((key) => {
      params.push(data[key])
      fields.push(key + '=$' + params.length)
    })
    if (fields.length === 0) return Promise.resolve()

    params.push(plan_id)
    return database.execute(`UPDATE client.active_plan SET ${fields.join(', ')}, updated_at=NOW() WHERE id=$${params.length}`,
      params)
  }

  // Clears all geography selection for a given plan id
  static clearGeographySelection(plan_id) {
    return Promise.all([
      database.execute('DELETE FROM client.selected_regions WHERE plan_id = $1', [plan_id]),
      database.execute('DELETE FROM client.selected_service_area WHERE plan_id = $1', [plan_id]),
      database.execute('DELETE FROM client.selected_analysis_area WHERE plan_id = $1', [plan_id])
    ])
  }

  // Adds the specified geographies to the plan
  static addGeographiesToPlan(plan_id, geographies) {

    var promises = []
    geographies.forEach((geography) => {
      var type = geography.type
      var id = geography.id
      var params = [plan_id, geography.name, id, type, geography.layerId || null]
      var queries = {
        'census_blocks': '(SELECT geom FROM census_blocks WHERE gid=$3::bigint)',
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
        if (type === 'user_defined') {
          query = `
            (
              SELECT geom
              FROM client.service_area
              JOIN client.service_layer
                ON service_area.service_layer_id = service_layer.id
              AND service_layer.id=$5::bigint
              WHERE service_area.id=$3::bigint
            )
          `
        } else {
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
        }
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

  static editRoute (plan_id, changes) {
    return Promise.resolve()
      .then(() => (
        this._addSources(plan_id, changes.insertions && changes.insertions.network_nodes)
      ))
      .then(() => (
        this._deleteSources(plan_id, changes.deletions && changes.deletions.network_nodes)
      ))
      .then(() => (
        changes.lazy ? null : models.Network.recalculateNodes(plan_id, changes)
      ))
      .then((data) => {
        return NetworkPlan.findPlan(plan_id)
          .then((plan) => {
            if (data) {
              plan.optimizationIdentifier = data.optimizationIdentifier
            }
            return plan
          })
      })
  }

  static exportKml (plan_id, planQuery) {
    var kml_output = '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Document>'

    planQuery = planQuery || `
      p.id IN (
        (SELECT r.id FROM client.active_plan r WHERE r.parent_plan_id IN (
          (SELECT id FROM client.active_plan WHERE parent_plan_id = $1)
        ))
      )
    `

    var escape = (name) => name.replace(/</g, '&lt;').replace(/>/g, '&gt;')

    return Promise.resolve()
      .then(() => (
        database.findOne('SELECT name FROM client.active_plan WHERE id=$1', [plan_id])
      ))
      .then((plan) => {
        kml_output += `<name>${escape(plan.name)}</name>
          <Style id="routeColor">
           <LineStyle>
             <color>ff0000ff</color>
             <width>4</width>
           </LineStyle>
          </Style>
          <Style id="coverageGeometryColor">
           <LineStyle>
             <color>cd000000</color>
             <width>1</width>
           </LineStyle>
           <PolyStyle>
             <color>cd00ff00</color>
           </PolyStyle>
          </Style>
          <Style id="targetColor">
           <IconStyle>
             <color>ffffff00</color>
             <scale>1</scale>
             <Icon>
               <href>http://maps.google.com/mapfiles/kml/pushpin/wht-pushpin.png</href>
             </Icon>
           </IconStyle>
          </Style>
          <Style id="sourceColor">
           <IconStyle>
             <color>ffff00ffff</color>
             <scale>1</scale>
             <Icon>
               <href>http://maps.google.com/mapfiles/kml/pushpin/wht-pushpin.png</href>
             </Icon>
           </IconStyle>
          </Style>
        `

        var sql = `
          SELECT
            ST_AsKML(seg.geom) AS geom,
            ST_Length(seg.geom::geography) AS length,
            (frt.description || ' ' || cct.description) AS fiber_type
          FROM client.active_plan p
          JOIN client.fiber_route ON fiber_route.plan_id = p.id
          JOIN client.fiber_route_type frt ON frt.id = fiber_route.fiber_route_type
          JOIN client.fiber_route_segment seg ON seg.fiber_route_id = fiber_route.id
          JOIN client.cable_construction_type cct ON cct.id = seg.cable_construction_type_id
          WHERE ${planQuery}
        `
        return database.query(sql, [plan_id])
      })
      .then((edges) => {
        kml_output += '<Folder><name>Fiber</name>'
        var types = _.groupBy(edges, 'fiber_type')
        Object.keys(types).forEach((type) => {
          if (types[type].length === 0) return
          kml_output += `<Folder><name>${escape(type)}</name>`
          types[type].forEach((edge) => {
            kml_output += `<Placemark><name>${escape(edge.length.toLocaleString('en', { maximumFractionDigits: 1 }))} m</name><styleUrl>#routeColor</styleUrl>${edge.geom}</Placemark>\n`
          })
          kml_output += '</Folder>'
        })
        kml_output += '</Folder>'

        var sql = `
          SELECT
            locations.id AS id,
            ST_AsKML(locations.geom) AS geom,
            t.id AS tower_id,
            b.category_name AS business_category,
            h.category_name AS household_category
          FROM client.plan_targets
          JOIN locations
            ON plan_targets.location_id = locations.id
          LEFT JOIN aro.towers t
            ON t.location_id = plan_targets.location_id
          LEFT JOIN client.basic_classified_business b
            ON b.location_id = plan_targets.location_id
          LEFT JOIN client.basic_classified_household h
            ON h.location_id = plan_targets.location_id
          WHERE plan_targets.plan_id = $1
        `
        return database.query(sql, [plan_id])
      })
      .then((targets) => {
        kml_output += `<Folder><name>${escape('Targets')}</name>`
        var towers = targets.filter((target) => target['tower_id'])
        var businesses = targets.filter((target) => target['business_category'])
        var households = targets.filter((target) => target['household_category'])
        var categories = null
        var names = {
          'b_large': 'Large Enterprise',
          'b_medium': 'Mid-tier',
          'b_small': 'SMB',
          'h_small': 'SFU',
          'h_medium': 'MDU'
        }

        var removeDuplicates = (arr) => {
          var ids = {}
          return arr.filter((obj) => {
            if (ids[obj.id]) return false
            ids[obj.id] = obj
            return true
          })
        }

        if (towers.length > 0) {
          kml_output += '<Folder><name>Cell Sites</name>'
          towers.forEach((target) => {
            kml_output += `<Placemark><styleUrl>#targetColor</styleUrl>${target.geom}</Placemark>\n`
          })
          kml_output += '</Folder>'
        }
        if (businesses.length > 0) {
          categories = _.groupBy(businesses, 'business_category')
          Object.keys(categories).forEach((category) => {
            var arr = removeDuplicates(categories[category])
            kml_output += `<Folder><name>${names[escape('b_' + category)]}</name>`
            arr.forEach((target) => {
              kml_output += `<Placemark><styleUrl>#targetColor</styleUrl>${target.geom}</Placemark>\n`
            })
            kml_output += '</Folder>'
          })
        }
        if (households.length > 0) {
          categories = _.groupBy(households, 'household_category')
          Object.keys(categories).forEach((category) => {
            var arr = removeDuplicates(categories[category])
            kml_output += `<Folder><name>${names[escape('b_' + category)]}</name>`
            arr.forEach((target) => {
              kml_output += `<Placemark><styleUrl>#targetColor</styleUrl>${target.geom}</Placemark>\n`
            })
            kml_output += '</Folder>'
          })
        }
        kml_output += '</Folder>'

        var sql = `
          SELECT
            ST_AsKML(nn.geom) AS geom, t.description,
            hstore_to_json(nn.attributes) as attributes,
            ST_AsKML(nn.coverage_geom) AS coverage_geom
          FROM client.network_nodes nn
          JOIN client.network_node_types t ON nn.node_type_id = t.id
          JOIN client.active_plan p ON nn.plan_id = p.id
          WHERE ${planQuery}
        `
        return database.query(sql, [plan_id])
      })
      .then((equipmentNodes) => {
        var types = _.groupBy(equipmentNodes, 'description')
        kml_output += '<Folder><name>Equipment</name>'
        // Mark network node types that contain non-null coverage geometry for use later below
        var nodeTypeHasGeometry = {}
        Object.keys(types).forEach((type) => {
          var arr = types[type]
          if (arr.length === 0) return
          kml_output += `<Folder><name>${escape(type)}</name>`
          arr.forEach((node) => {
            var name = (node.attributes || {}).name || ''
            kml_output += `<Placemark><styleUrl>#sourceColor</styleUrl><name>${escape(name)}</name>${node.geom}</Placemark>\n`
            if (node.coverage_geom) {
              nodeTypeHasGeometry[type] = true
            }
          })
          kml_output += '</Folder>'
        })
        kml_output += '</Folder>'

        // Export 5G coverage polygons
        kml_output += '<Folder><name>Coverage Areas</name>'
        Object.keys(types).forEach((type) => {
          if (nodeTypeHasGeometry[type]) {  // Only export coverage if this type has coverage geometry associated with it
            var arr = types[type]
            if (arr.length === 0) return
            kml_output += `<Folder><name>${escape(type)}</name>`
            arr.forEach((node) => {
              var name = (node.attributes || {}).name || ''
              kml_output += `<Placemark><styleUrl>#coverageGeometryColor</styleUrl><name>${escape(name)}</name>${node.coverage_geom}</Placemark>\n`
            })
            kml_output += '</Folder>'
          }
        })
        kml_output += '</Folder>'


        kml_output += '</Document></kml>'
        return kml_output
      })
  }

  static calculateAreaData (plan_id) {
    return Promise.resolve()
      .then(() => {
        var sql = `
          SELECT statefp, countyfp, MIN(ST_distance(geom, (SELECT area_centroid FROM client.active_plan WHERE id=$1) )) AS distance
          FROM aro.cousub
          GROUP BY statefp, countyfp
          ORDER BY distance
          LIMIT 1
        `
        return database.findOne(sql, [plan_id])
      })
      .then((row) => ({
        statefp: row && row.statefp,
        countyfp: row && row.countyfp
      }))
  }

  static searchBusinesses (text) {
    var sql = `
      SELECT
        id,
        name,
        ST_AsGeoJSON(ST_centroid(geom))::json AS centroid,
        ST_AsGeoJSON(ST_envelope(geom))::json AS bounds
      FROM aro.businesses
      WHERE to_tsvector('english', name) @@ plainto_tsquery($1)
      LIMIT 100
    `
    return database.query(sql, [text.toLowerCase()])
  }

  static searchAddresses(text, sessionToken, biasLatitude, biasLongitude) {
    if (!text || (typeof text !== 'string')) {
      text = ''
    }
    text = text.trim()
    if ('' == text) {
      logger.warn(`Search requested for empty or invalid text - ${text}`)
      return Promise.resolve([])
    }

    // Regex for checking if the search expression is a valid "latitude, longitude". From https://stackoverflow.com/a/18690202
    var matches = text.match(/[+-]?([0-9]*[.])?[0-9]+.[\s,]+[+-]?([0-9]*[.])?[0-9]+/)
    if (matches && matches.length > 0 && matches[0] == text) {
      // This is a valid latitude/longitude search expression (technically it is of the form "[number],[number]")
      var latLng = text.split(/[\s,]+/).map((item) => item.trim(item))
      return Promise.resolve([{
        type: 'latlng',
        displayText: `Latitude: ${latLng[0]}, Longitude: ${latLng[1]}`,
        value: latLng
      }])
    } else {
      // Ask google to predict what the responses may be
      if (!process.env.GOOGLE_MAPS_API_IP_KEY) {
        return Promise.resolve([
          {
            type: 'error',
            displayText: 'ERROR: GOOGLE_MAPS_API_KEY not defined'
          }
        ])
      } else {
        const queryParameters = {
          input: text,
          sessiontoken: sessionToken,
          key: process.env.GOOGLE_MAPS_API_IP_KEY
        }
        // If the user has provided a "bias" location, set it so that the results will be filtered according to this location.
        if (biasLatitude && biasLongitude) {
          const BIAS_RADIUS = 100000  // In meters. Why this specific number? No reason. "Seems ok"
          queryParameters.location = `${biasLatitude},${biasLongitude}`
          queryParameters.radius = BIAS_RADIUS
        }
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`
        logger.info(`Getting autocomplete results from ${url} with query parameters:`)
        logger.info(queryParameters)
        return request({url: url, qs: queryParameters, json: true})
          .then((result) => {
            var compressedResults = []
            result[1].predictions.forEach((item) => {
              compressedResults.push({
                type: 'placeId',
                value: item.place_id,
                displayText: item.description
              })
            })
            return Promise.resolve(compressedResults)
          })
      }
    }
  }

  static _callService (req) {
    return models.AROService.request(req)
  }

  static inrange(min,number,max){
    if ( !isNaN(number) && (number >= min) && (number <= max) ){
      return true;
    } else {
      return false;
    }
  }
}

var entityNames = []
database.query('SELECT * FROM client.entity_category').then((rows) => { entityNames = rows })

// var cableConstructionTypes = []
// database.query('SELECT * FROM client.cable_construction_type WHERE name <> \'estimated\' ORDER BY description ASC').then((rows) => {
//   cableConstructionTypes = rows
//   cableConstructionTypes.push({
//     name: 'estimated',
//     description: 'Estimated Medium'
//   })
// })
