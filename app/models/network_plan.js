// Network plan
//
// The Route Optimizer finds shortest paths between sources and targets

'use strict'

var helpers = require('../helpers')
var config = helpers.config
var database = helpers.database
var validate = helpers.validate
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

  static findEdges (plan_id) {
    var sql = `
      SELECT
        fiber_route.id,
        ST_Length(geom::geography) * 0.000621371 AS edge_length,
        ST_AsGeoJSON(fiber_route.geom)::json AS geom,
        frt.name AS fiber_type,
        frt.description AS fiber_name
      FROM client.plan
      JOIN client.plan p ON p.parent_plan_id = plan.id
      JOIN client.fiber_route ON fiber_route.plan_id = p.id
      JOIN client.fiber_route_type frt ON frt.id = fiber_route.fiber_route_type
      WHERE plan.id=$1
    `
    return database.query(sql, [plan_id])
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
          created_at, updated_at
        FROM client.plan
        LEFT JOIN auth.permissions ON permissions.plan_id = plan.id AND permissions.rol = 'owner'
        LEFT JOIN auth.users ON users.id = permissions.user_id
        WHERE plan.id=$1
      `, [plan_id, config.client_carrier_name])
      .then((_plan) => {
        plan = _plan
        Object.keys(plan).forEach((key) => {
          output[key] = plan[key]
        })

        return Promise.all([
          models.Network.equipmentSummary(plan_id),
          models.Network.fiberSummary(plan_id),
          models.Network.irrAndNpv(plan_id)
        ])
      })
      .then((results) => {
        output.metadata.npv = results[2].npv
        output.metadata.irr = results[2].irr

        output.metadata.equipment_summary = attachCostDescription(results[0])
        output.metadata.fiber_summary = attachCostDescription(results[1])

        output.metadata.equipment_cost = results[0].reduce((total, item) => item.totalCost + total, 0)
        output.metadata.fiber_cost = results[1].reduce((total, item) => item.totalCost + total, 0)

        plan.total_cost = output.metadata.equipment_cost + output.metadata.fiber_cost

        return NetworkPlan.findEdges(plan_id)
      })
      .then((edges) => {
        output.feature_collection.features = edges.map((edge) => ({
          'type': 'Feature',
          'geometry': edge.geom,
          'properties': {
            'fiber_type': edge.fiber_type
          }
        }))

        var sql = `
          SELECT
            SUM(household_count) AS household_count,
            SUM(business_count) AS business_count,
            SUM(celltower_count) AS tower_count
          FROM client.network_nodes n
          WHERE plan_id IN (
            SELECT id FROM client.plan WHERE parent_plan_id=$1
            UNION ALL
            SELECT $1
          )
          AND n.node_type_id = 1
        `
        return database.findOne(sql, [plan_id])
      })
      .then((row) => {
        output.metadata.premises = [
          {
            name: 'Households',
            value: row.household_count
          },
          {
            name: 'Businesses',
            value: row.business_count
          },
          {
            name: 'Towers',
            value: row.tower_count / 64
          }
        ]
        output.metadata.total_premises = output.metadata.premises.reduce((total, item) => total + item.value, 0)

        return database.query(`
          SELECT
            region_id AS id, region_name AS name, region_type AS type, ST_AsGeoJSON(geom)::json AS geog
          FROM client.selected_regions WHERE plan_id = $1
        `, [plan_id])
      })
      .then((selectedRegions) => {
        output.metadata.selectedRegions = selectedRegions

        // return config.route_planning.length > 0
        //   ? models.CustomerProfile.customerProfileForRoute(plan_id, output.metadata)
        //   : models.CustomerProfile.customerProfileForExistingFiber(plan_id, output.metadata)

        plan.total_revenue = plan.total_revenue || 0
        plan.total_cost = plan.total_cost || 0
        output.metadata.revenue = plan.total_revenue
        output.metadata.total_cost = plan.total_cost || 0
        output.metadata.profit = output.metadata.revenue - output.metadata.total_cost

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
          .then(() => {
            console.log('Plan updated')
          })
          .catch((err) => {
            console.log('err', err)
          })

        if (metadata_only) delete output.feature_collection
        return output
      })
  }

  static findAll (user, options) {
    var text = options.text
    var sortField = options.sortField
    var sortOrder = options.sortOrder
    var page = options.page || 1
    var minimumCost = options.minimumCost
    var maximumCost = options.maximumCost

    console.log('arguments', arguments)
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
        `
        var params = [config.client_carrier_name]
        if (user) {
          params.push(user.id)
          sql += ` WHERE plan.id IN (SELECT plan_id FROM auth.permissions WHERE user_id=$${params.length})`
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
        VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3::text), 4326), ST_Envelope(ST_SetSRID(ST_GeomFromGeoJSON($4::text), 4326)), NOW(), NOW(), 'M') RETURNING id;
      `
      var params = [
        name,
        area.name,
        JSON.stringify(area.centroid),
        JSON.stringify(area.bounds)
      ]
      console.log('params', params)
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
        models.Network.recalculateNodes(plan_id, changes)
      ))
      .then(() => NetworkPlan.findPlan(plan_id))
  }

  static exportKml (plan_id) {
    var kml_output = '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'

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
          SELECT ST_AsKML(fiber_route.geom) AS geom
          FROM client.plan
          JOIN client.plan p ON p.parent_plan_id = plan.id
          JOIN client.fiber_route ON fiber_route.plan_id = p.id
          WHERE plan.id=$1
        `
        return database.query(sql, [plan_id])
      })
      .then((edges) => {
        edges.forEach((edge) => {
          kml_output += `<Placemark><styleUrl>#routeColor</styleUrl>${edge.geom}</Placemark>\n`
        })

        var sql = `
          SELECT ST_AsKML(locations.geom) AS geom
          FROM client.plan_targets
          JOIN locations
            ON plan_targets.location_id = locations.id
          WHERE plan_targets.plan_id=$1
        `
        return database.query(sql, [plan_id])
      })
      .then((targets) => {
        targets.forEach((target) => {
          kml_output += `<Placemark><styleUrl>#targetColor</styleUrl>${target.geom}</Placemark>\n`
        })

        // TODO: network nodes in child plans
        var sql = `
          SELECT ST_AsKML(network_nodes.geom) AS geom
          FROM client.plan_sources
          JOIN client.network_nodes
            ON plan_sources.network_node_id = network_nodes.id
          WHERE plan_sources.plan_id=$1
        `
        return database.query(sql, [plan_id])
      })
      .then((sources) => {
        sources.forEach((source) => {
          kml_output += `<Placemark><styleUrl>#sourceColor</styleUrl>${source.geom}</Placemark>\n`
        })

        var sql = `
          SELECT ST_AsKML(geom) AS geom
          FROM client.network_nodes
          WHERE plan_id IN (
            SELECT id FROM client.plan WHERE parent_plan_id=$1
            UNION ALL
            SELECT $1
          )
        `
        return database.query(sql, [plan_id])
      })
      .then((nodes) => {
        nodes.forEach((source) => {
          kml_output += `<Placemark><styleUrl>#sourceColor</styleUrl>${source.geom}</Placemark>\n`
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
        statefp: row.statefp,
        countyfp: row.countyfp
      }))
  }

  static searchAddresses (text) {
    var sql = `
      SELECT
        wirecenter || ' - ' || aocn_name as name,
        ST_AsGeoJSON(ST_centroid(geom))::json as centroid,
        ST_AsGeoJSON(ST_envelope(geom))::json as bounds
      FROM wirecenters
      WHERE
        lower(unaccent(aocn_name)) LIKE lower(unaccent($1)) OR
        lower(unaccent(wirecenter)) LIKE lower(unaccent($1))
      ORDER BY wirecenter ASC
    `
    var wirecenters = database.query(sql, [`%${text}%`])
    var addresses = request({ url: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(text), json: true })
    return Promise.all([wirecenters, addresses])
      .then((results) => {
        var wirecenters = results[0]
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
        return wirecenters.concat(addresses)
      })
  }

}

var financialCosts = []
database.query('SELECT * FROM financial.network_cost_code').then((rows) => { financialCosts = rows })

const attachCostDescription = (arr) => {
  arr.forEach((item) => {
    var code = item.costCode
    var cost = financialCosts.find((item) => item.id === code)
    if (cost) {
      item.description = cost.description
    }
  })
  return arr
}
