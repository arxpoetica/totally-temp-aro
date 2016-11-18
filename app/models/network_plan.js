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

  static _addTargets (plan_id, location_ids) {
    if (!_.isArray(location_ids) || location_ids.length === 0) return Promise.resolve()

    return Promise.resolve()
      .then(() => {
        // avoid duplicates
        var sql = `
          DELETE FROM client.plan_targets
          WHERE plan_id=$1 AND location_id IN ($2)
        `
        return database.execute(sql, [plan_id, location_ids])
      })
      .then(() => {
        // calculate closest vertex
        // TODO: simplify
        var sql = `
          INSERT INTO client.plan_targets (location_id, plan_id)
          (SELECT locations.id, $2 AS plan_id
             FROM locations
            WHERE locations.id IN ($1))
        `
        return database.execute(sql, [location_ids, plan_id])
      })
      .then(() => {
        // cannot selet both targets and boundaires
        return Promise.all([
          database.execute('DELETE FROM client.selected_regions WHERE plan_id = $1', [plan_id]),
          database.execute('DELETE FROM client.selected_service_area WHERE plan_id = $1', [plan_id]),
          database.execute('DELETE FROM client.selected_analysis_area WHERE plan_id = $1', [plan_id])
        ])
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

  static _deleteTargets (plan_id, location_ids) {
    if (!_.isArray(location_ids) || location_ids.length === 0) return Promise.resolve()

    return pync.series(location_ids, (location_id) => {
      var sql = `
        DELETE FROM client.plan_targets
        WHERE plan_id=$1 AND location_id=$2
      `
      return database.execute(sql, [plan_id, location_id])
    })
  }

  static copyPlan (plan_id, name, user) {
    return database.findOne(`
      INSERT INTO client.plan (name, area_name, area_centroid, area_bounds, created_at, updated_at, plan_type, location_types)
      SELECT
        $2 AS name,
        area_name,
        area_centroid,
        area_bounds,
        NOW() AS created_at,
        NOW() AS updated_at,
        'R' AS plan_type,
        location_types
      FROM client.plan WHERE id=$1
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
            $2::text AS carrier_name,
            plan.id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds,
            users.id as owner_id, users.first_name as owner_first_name, users.last_name as owner_last_name,
            created_at, updated_at
          FROM
            client.plan
          LEFT JOIN auth.permissions ON permissions.plan_id = plan.id AND permissions.rol = 'owner'
          LEFT JOIN auth.users ON users.id = permissions.user_id
          WHERE plan.id=$1
        `
        return database.findOne(sql, [id, config.client_carrier_name])
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
          $2::text AS carrier_name,
          plan.id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds,
          users.id as owner_id, users.first_name as owner_first_name, users.last_name as owner_last_name,
          created_at, updated_at, location_types,
          (SELECT EXISTS(SELECT id FROM client.plan WHERE parent_plan_id=$1 LIMIT 1)) AS "ranOptimization"
        FROM client.plan
        LEFT JOIN auth.permissions ON permissions.plan_id = plan.id AND permissions.rol = 'owner'
        LEFT JOIN auth.users ON users.id = permissions.user_id
        WHERE plan.id=$1
      `, [plan_id, config.client_carrier_name])
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
          { name: 'arial', description: 'Aerial' },
          { name: 'buried', description: 'Buried' },
          { name: 'underground', description: 'Underground' },
          { name: 'obstacle', description: 'Other' },
          { name: 'conduit', description: 'Augmented Conduit' },
          { name: 'estimated', description: 'Estimated Medium' },
          { name: 'planned_conduit', description: 'Overlaid on Fronthaul' }
        ]

        output.metadata.fiberTotals = { types: {}, totalLength: 0, totalCost: 0 }
        var fiberTypes = ['distribution', 'feeder', 'backhaul']
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
          var cost = financialCosts.find((i) => i.name === item.nodeType)
          return {
            totalCost: item.total,
            description: (cost && cost.description) || item.nodeType,
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
            UPDATE client.plan SET
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
            console.log('err', err)
          })

        if (metadata_only) delete output.feature_collection
        return output
      })
  }

  static findWirecenterPlan (plan_id, wirecenter_id) {
    var params = [plan_id, wirecenter_id]
    return database.findOne(`
        SELECT id FROM client.plan WHERE parent_plan_id IN (SELECT id from client.plan WHERE parent_plan_id=$1)
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
        FROM client.plan p
        JOIN client.service_layer sl ON p.service_layer_id = sl.id
        JOIN client.service_area sa ON p.wirecenter_id = sa.id
        WHERE plan_type='W' AND parent_plan_id IN (SELECT id from client.plan WHERE parent_plan_id=$1)
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

    var num = 20
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
            $1::text AS carrier_name,
            plan.id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds,
            users.id as owner_id, users.first_name as owner_first_name, users.last_name as owner_last_name,
            created_at, updated_at
          FROM client.plan
          LEFT JOIN auth.permissions ON permissions.plan_id = plan.id AND permissions.rol = 'owner'
          LEFT JOIN auth.users ON users.id = permissions.user_id
          WHERE plan.plan_type='R'
        `
        var params = [config.client_carrier_name]
        if (user) {
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
                FROM client.plan
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
        sql += ` ORDER BY ${sortField} ${sortOrder} LIMIT ${num} OFFSET ${(page - 1) * num}`
        return database.query(sql, params)
      })
      .then((plans) => {
        var params = []
        var sql = 'SELECT COUNT(*) AS count from client.plan'
        if (user) {
          sql += ' WHERE plan.id IN (SELECT plan_id FROM auth.permissions WHERE user_id=$1)'
          params.push(user.id)
        }
        return database.findOne(sql, params)
          .then((result) => {
            var count = result.count
            var pages = []
            var i = 0
            while (i * num < count) {
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
        INSERT INTO client.plan (name, area_name, area_centroid, area_bounds, created_at, updated_at, plan_type)
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
          JOIN client.plan
            ON plan.id = $1
      ORDER BY plan.area_bounds <#> network_nodes.geom LIMIT 1)
      `
      return database.execute(sql, [id])
    })
    .then(() => {
      var sql = `
        SELECT
          $2::text AS carrier_name,
          plan.id, name, area_name, ST_AsGeoJSON(area_centroid)::json as area_centroid, ST_AsGeoJSON(area_bounds)::json as area_bounds,
          users.id as owner_id, users.first_name as owner_first_name, users.last_name as owner_last_name,
          created_at, updated_at
        FROM
          client.plan
        LEFT JOIN auth.permissions ON permissions.plan_id = plan.id AND permissions.rol = 'owner'
        LEFT JOIN auth.users ON users.id = permissions.user_id
        WHERE plan.id=$1
      `
      return database.findOne(sql, [id, config.client_carrier_name])
    })
  }

  static deletePlan (plan_id) {
    return database.execute('DELETE FROM client.plan WHERE id=$1', [plan_id])
  }

  static clearRoute (plan_id) {
    return Promise.resolve()
      .then(() => (
        database.execute('DELETE FROM client.plan_targets WHERE plan_id=$1', [plan_id])
      ))
      .then(() => (
        database.execute('DELETE FROM client.plan_sources WHERE plan_id=$1', [plan_id])
      ))
      .then(() => (
        database.execute('DELETE FROM client.fiber_route WHERE plan_id=$1', [plan_id])
      ))
      .then(() => (
        database.execute('DELETE FROM client.network_nodes WHERE plan_id=$1', [plan_id])
      ))
      .then(() => (
        database.execute('DELETE FROM client.plan WHERE parent_plan_id=$1', [plan_id])
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
    return database.execute(`UPDATE client.plan SET ${fields.join(', ')}, updated_at=NOW() WHERE id=$${params.length}`,
      params)
  }

  static editRoute (plan_id, changes) {
    return Promise.resolve()
      .then(() => (
        this._addSources(plan_id, changes.insertions && changes.insertions.network_nodes)
      ))
      .then(() => (
        this._addTargets(plan_id, changes.insertions && changes.insertions.locations)
      ))
      .then(() => (
        this._deleteSources(plan_id, changes.deletions && changes.deletions.network_nodes)
      ))
      .then(() => (
        this._deleteTargets(plan_id, changes.deletions && changes.deletions.locations)
      ))
      .then(() => (
        changes.lazy ? null : models.Network.recalculateNodes(plan_id, changes)
      ))
      .then(() => NetworkPlan.findPlan(plan_id))
  }

  static exportKml (plan_id, planQuery) {
    var kml_output = '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'

    planQuery = planQuery || `
      p.id IN (
        (SELECT r.id FROM client.plan r WHERE r.parent_plan_id IN (
          (SELECT id FROM client.plan WHERE parent_plan_id = $1)
        ))
      )
    `

    var escape = (name) => name.replace(/</g, '&lt;').replace(/>/g, '&gt;')

    return Promise.resolve()
      .then(() => (
        database.findOne('SELECT name FROM client.plan WHERE id=$1', [plan_id])
      ))
      .then((plan) => {
        kml_output += `<name>${escape(plan.name)}</name>
          <Style id="routeColor">
           <LineStyle>
             <color>ff0000ff</color>
             <width>4</width>
           </LineStyle>
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
          FROM client.plan p
          JOIN client.fiber_route ON fiber_route.plan_id = p.id
          JOIN client.fiber_route_type frt ON frt.id = fiber_route.fiber_route_type
          JOIN client.fiber_route_segment seg ON seg.fiber_route_id = fiber_route.id
          JOIN client.cable_construction_type cct ON cct.id = seg.cable_construction_type_id
          WHERE ${planQuery}
        `
        return database.query(sql, [plan_id])
      })
      .then((edges) => {
        var types = _.groupBy(edges, 'fiber_type')
        Object.keys(types).forEach((type) => {
          kml_output += `<Folder><name>${escape(type)}</name>`
          types[type].forEach((edge) => {
            kml_output += `<Placemark><name>${escape(edge.length.toLocaleString('en', { maximumFractionDigits: 1 }))} m</name><styleUrl>#routeColor</styleUrl>${edge.geom}</Placemark>\n`
          })
          kml_output += '</Folder>'
        })

        var sql = `
          SELECT ST_AsKML(locations.geom) AS geom
          FROM client.plan_targets
          JOIN locations
            ON plan_targets.location_id = locations.id
          WHERE plan_targets.plan_id = $1
        `
        return database.query(sql, [plan_id])
      })
      .then((targets) => {
        kml_output += `<Folder><name>${escape('Targets')}</name>`
        targets.forEach((target) => {
          kml_output += `<Placemark><styleUrl>#targetColor</styleUrl>${target.geom}</Placemark>\n`
        })
        kml_output += '</Folder>'

        var sql = `
          SELECT ST_AsKML(nn.geom) AS geom, t.description
          FROM client.network_nodes nn
          JOIN client.network_node_types t ON nn.node_type_id = t.id
          JOIN client.plan p ON nn.plan_id = p.id
          WHERE ${planQuery}
        `
        return database.query(sql, [plan_id])
      })
      .then((equipmentNodes) => {
        var types = _.groupBy(equipmentNodes, 'description')
        Object.keys(types).forEach((type) => {
          var arr = types[type]
          kml_output += `<Folder><name>${escape(type)}</name>`
          arr.forEach((node) => {
            kml_output += `<Placemark><styleUrl>#sourceColor</styleUrl>${node.geom}</Placemark>\n`
          })
          kml_output += '</Folder>'
        })

        kml_output += '</Document></kml>'
        return kml_output
      })
  }

  static calculateAreaData (plan_id) {
    return Promise.resolve()
      .then(() => {
        var sql = `
          SELECT statefp, countyfp, MIN(ST_distance(geom, (SELECT area_centroid FROM client.plan WHERE id=$1) )) AS distance
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

  static searchAddresses (text) {
    var sql = `
      SELECT
        code AS name,
        ST_AsGeoJSON(ST_centroid(geom))::json AS centroid,
        ST_AsGeoJSON(ST_envelope(geom))::json AS bounds
        FROM client.service_area
       WHERE service_layer_id = (
          SELECT id FROM client.service_layer WHERE name='wirecenter'
        )
        AND lower(unaccent(code)) LIKE lower(unaccent($1))

      UNION ALL

      SELECT
        name,
        ST_AsGeoJSON(ST_centroid(geom))::json AS centroid,
        ST_AsGeoJSON(ST_envelope(geom))::json AS bounds
      FROM aro.businesses
      WHERE to_tsvector('english', name) @@ plainto_tsquery($2)

      ORDER BY name ASC
      LIMIT 100
    `
    var wirecenters = database.query(sql, [`%${text}%`, text.toLowerCase()])
    var addresses = text.length > 0
      ? request({ url: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(text), json: true })
      : Promise.resolve(null)
    return Promise.all([wirecenters, addresses])
      .then((results) => {
        var wirecenters = results[0]
        if (!results[1]) return wirecenters
        var addresses = results[1][1].results.map((item) => {
          var ne = item.geometry.viewport.northeast
          var sw = item.geometry.viewport.southwest
          return {
            name: item.formatted_address,
            centroid: {
              type: 'Point',
              coordinates: [item.geometry.location.lng, item.geometry.location.lat]
            },
            bounds: {
              type: 'Polygon',
              coordinates: [[[ne.lng, ne.lat], [ne.lng, sw.lat], [sw.lng, sw.lat], [sw.lng, ne.lat], [ne.lng, ne.lat]]
            ]}
          }
        })
        return addresses.concat(wirecenters)
      })
  }

}

var financialCosts = []
database.query('SELECT * FROM financial.network_cost_code').then((rows) => { financialCosts = rows })

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
