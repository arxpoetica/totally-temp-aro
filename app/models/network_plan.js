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
    // var cost_per_meter = 200
    var output = {
      'feature_collection': {
        'type': 'FeatureCollection'
      },
      'metadata': { costs: [] }
    }
    var plan, equipmentCounts

    return database.findOne('SELECT * FROM client.plan WHERE id=$1', [plan_id])
      .then((_plan) => {
        plan = _plan

        if (config.route_planning.length === 0) return
        return Promise.resolve()
          .then(() => NetworkPlan.findEdges(plan_id))
          .then((edges) => {
            var fiberLengths = {}
            edges.forEach((edge) => {
              var type = edge.fiber_name
              fiberLengths[type] = (fiberLengths[type] || 0) + edge.edge_length
            })
            var fiberLength = (edges.reduce((total, edge) => total + edge.edge_length, 0)).toFixed(2)
            output.metadata.costs.push({
              name: `Fiber Capex (${fiberLength} mi)`,
              value: plan.fiber_cost || 0,
              itemized: Object.keys(fiberLengths).map((type) => {
                var length = (fiberLengths[type]).toFixed(2)
                return {
                  description: `${type} (${length} mi)`,
                  value: 0
                }
              })
            })
            output.feature_collection.features = edges.map((edge) => ({
              'type': 'Feature',
              'geometry': edge.geom,
              'properties': {
                'fiber_type': edge.fiber_type
              }
            }))
          })
      })
      .then(() => {
        var params = [plan_id]
        return database.query(`
          SELECT nnt.id, COUNT(*) AS count
          FROM client.network_node_types nnt
          JOIN client.network_nodes nn
          ON nn.node_type_id = nnt.id
          AND nn.plan_id IN (
            SELECT id FROM client.plan WHERE parent_plan_id=$${params.length}
            UNION ALL
            SELECT $${params.length}
          )
          GROUP BY nnt.id
        `, params)
      })
      .then((_equipmentCounts) => {
        equipmentCounts = _equipmentCounts

        return config.route_planning.length > 0
          ? models.CustomerProfile.customerProfileForRoute(plan_id, output.metadata)
          : models.CustomerProfile.customerProfileForExistingFiber(plan_id, output.metadata)
      })
      .then(() => {
        if (config.route_planning.length === 0) return output

        plan.total_revenue = plan.total_revenue || 0
        plan.total_cost = plan.total_cost || 0
        output.metadata.revenue = plan.total_revenue
        var year = new Date().getFullYear()
        output.metadata.total_npv = plan.npv || 0
        output.metadata.npv = [
          { year: year++, value: plan.total_revenue - plan.total_cost },
          { year: year++, value: plan.total_revenue },
          { year: year++, value: plan.total_revenue },
          { year: year++, value: plan.total_revenue },
          { year: year++, value: plan.total_revenue }
        ]
        return database.query('SELECT * FROM client.network_node_types ORDER BY description')
      })
      .then((equipmentNodeTypes) => {
        var itemized = equipmentNodeTypes.map((equipmentNodeType) => {
          var name = equipmentNodeType.name
          var col = name.split('_').map((s) => s.substring(0, 1)).join('') + '_cost'
          if (!plan[col]) return null
          var count = equipmentCounts.find((eq) => eq.id === equipmentNodeType.id)
          count = count ? count.count : 0
          return {
            key: name,
            name: equipmentNodeType.description,
            description: equipmentNodeType.description + (name === 'central_office' ? '' : ` (x${count})`),
            count: count.count,
            value: plan[col] || 0
          }
        }).filter((i) => i)
        output.metadata.costs.push({
          name: 'Equipment Capex',
          value: plan.equipment_cost
          // itemized: itemized
        })
        output.metadata.total_cost = plan.total_cost || 0

        output.metadata.profit = output.metadata.revenue - output.metadata.total_cost
        if (metadata_only) delete output.feature_collection
        return output
      })
  }

  static findAll (user, text) {
    var sql = `
      SELECT
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
      sql += ' WHERE plan.id IN (SELECT plan_id FROM auth.permissions WHERE user_id=$2)'
      params.push(user.id)
    }
    if (text) {
      sql += ' AND lower(name) LIKE lower($3)'
      params.push(`%${text}%`)
    }
    sql += '\n LIMIT 20'
    return database.query(sql, params)
  }

  static createPlan (name, area, user) {
    var id

    return validate((expect) => {
      expect(area, 'area', 'object')
      expect(area, 'area.centroid', 'object')
      expect(area, 'area.centroid.lat', 'number')
      expect(area, 'area.centroid.lng', 'number')
      expect(area, 'area.bounds', 'object')
      expect(area, 'area.bounds.northeast', 'object')
      expect(area, 'area.bounds.northeast.lat', 'number')
      expect(area, 'area.bounds.northeast.lng', 'number')
      expect(area, 'area.bounds.southwest', 'object')
      expect(area, 'area.bounds.southwest.lat', 'number')
      expect(area, 'area.bounds.southwest.lng', 'number')
    })
    .then(() => {
      var sql = `
        INSERT INTO client.plan (name, area_name, area_centroid, area_bounds, created_at, updated_at, plan_type)
        VALUES ($1, $2, ST_GeomFromText($3, 4326), ST_Envelope(ST_GeomFromText($4, 4326)), NOW(), NOW(), 'M') RETURNING id;
      `
      var params = [
        name,
        area.name,
        `POINT(${area.centroid.lng} ${area.centroid.lat})`,
        `LINESTRING(${area.bounds.northeast.lng} ${area.bounds.northeast.lat}, ${area.bounds.southwest.lng} ${area.bounds.southwest.lat})`
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

}
