// Location
//
// A Location is a point in space which can contain other objects such as businesses and households
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var config = helpers.config
var models = require('../models')
var fs = require('fs')

module.exports = class Location {

  /*
  * Returns the businesses and households locations except the selected ones
  */
  static findLocations (plan_id, filters, viewport) {
    var businesses = filters.business_categories
    var households = filters.household_categories
    var dataSources = (filters.dataSources || []).map((id) => +id || -1)

    if (businesses.length === 0) businesses = ['']
    if (households.length === 0) households = ['']
    if (dataSources.length === 0) dataSources = [-1]

    var sql = `
      WITH view_window as (
          select ST_SetSRID(ST_MakePolygon(ST_GeomFromText('${viewport.linestring}')), 4326) as geog
        ),
        states AS (
        SELECT st.stusps
        FROM aro.states st
            JOIN view_window vw
                ON st_intersects(cast(vw.geog AS GEOMETRY), st.geom)
      ),
      features AS (
        SELECT l.id, l.geom,
          array_remove(array_agg(DISTINCT 'b_' || b.category_name::text)
            || array_agg(DISTINCT 'h_' || h.category_name::text)
            || array_agg(distinct CASE WHEN t.id IS NULL THEN NULL ELSE 'towers' END),
          NULL) AS entity_categories
        FROM aro.locations l
          INNER JOIN states st
              ON st.stusps = l.state
          INNER JOIN
          view_window vw ON
            ST_Intersects(vw.geog, l.geog)
        AND l.state IN (select stusps from states)

        LEFT JOIN client.plan_targets pt
          ON pt.location_id = l.id
          AND pt.plan_id = $1

        LEFT JOIN aro.towers t
          ON t.location_id = l.id
          AND t.data_source_id IN ($2)

        LEFT JOIN client.basic_classified_business b
          ON b.location_id = l.id
          AND b.category_name IN ($3)

        LEFT JOIN client.basic_classified_household h
          ON h.location_id = l.id
          AND h.category_name IN ($4)

        WHERE (t.id IS NOT NULL OR b.id IS NOT NULL OR h.id IS NOT NULL) AND pt.location_id IS NULL
        GROUP BY 1,2
      )
    `
    var params = [plan_id, dataSources, businesses, households]
    return database.points(sql, params, true, viewport)
  }

  /*
  * Returns the selected locations with businesses and households on them
  */
  static findSelected (plan_id, viewport) {
    var sql = `
      WITH visible_locations AS (
        SELECT locations.* FROM locations
        INNER JOIN aro.states st ON ST_Intersects(locations.geom, st.geom)
        ${database.intersects(viewport, 'locations.geom', 'WHERE')}
      ),
      unselected_locations AS (
        SELECT visible_locations.* FROM visible_locations
        LEFT JOIN client.plan_targets
          ON plan_targets.plan_id = $1
         AND plan_targets.location_id = visible_locations.id
        WHERE plan_targets.location_id IS NOT NULL
      ),
      categorized_locations AS (
        SELECT *, (
          array(
            SELECT DISTINCT 'b_' || c.name
            FROM businesses b
            JOIN client.business_categories c ON b.number_of_employees >= c.min_value AND b.number_of_employees < c.max_value
            JOIN client.employees_by_location e ON (b.number_of_employees >= e.min_value) AND (b.number_of_employees <= e.max_value)
            WHERE b.location_id = unselected_locations.id
          )
          ||
          array(
            SELECT DISTINCT 'h_' || c.name
            FROM households b
            JOIN client.household_categories c ON b.number_of_households >= c.min_value AND b.number_of_households < c.max_value
            WHERE b.location_id = unselected_locations.id
          )
          ||
          array(
            SELECT 'towers'::text FROM towers t
            WHERE t.location_id = unselected_locations.id
          )
        ) AS entity_categories
        FROM unselected_locations
      ),
      features AS (
        SELECT true AS selected, categorized_locations.id, categorized_locations.geom, total_businesses, total_households, entity_categories
        FROM categorized_locations
      )
    `
    return database.points(sql, [plan_id], true, viewport)
  }

  // Selected locations as a list
  static findTargets (plan_id) {
    var sql = `
      SELECT locations.id, address
      FROM locations
      JOIN client.plan_targets
        ON plan_targets.plan_id = $1
       AND plan_targets.location_id = locations.id
     ORDER BY locations.id ASC
     LIMIT 10
    `
    return database.query(sql, [plan_id])
      .then((targets) => {
        return database.findOne(`
          SELECT COUNT(*) AS total
          FROM locations
          JOIN client.plan_targets
            ON plan_targets.plan_id=$1
           AND plan_targets.location_id = locations.id
        `, [plan_id])
          .then((row) => {
            return {
              targets: targets,
              total: row.total
            }
          })
      })
  }

  static deleteTarget (plan_id, locationId) {
    var sql = 'DELETE FROM client.plan_targets WHERE plan_id=$1 AND location_id=$2'
    return database.query(sql, [plan_id, locationId])
      .then(() => this.findTargets(plan_id))
  }

  static deleteAllTargets (plan_id) {
    var sql = 'DELETE FROM client.plan_targets WHERE plan_id=$1'
    return database.query(sql, [plan_id])
      .then(() => this.findTargets(plan_id))
  }

  // Get summary information for a given location
  static showInformation (plan_id, location_id) {
    var info
    return Promise.resolve()
      .then(() => {
        var sql = `
          select
            location_id,
            sum(entry_fee)::integer as entry_fee,
            sum(install_cost)::integer as business_install_costs,
            sum(install_cost_per_hh)::integer as household_install_costs,
            sum(number_of_households)::integer as number_of_households,
            sum(number_of_businesses)::integer as number_of_businesses,
            sum(number_of_towers)::integer as number_of_towers
          from (
            select
              location_id, entry_fee, 0 as install_cost, 0 as install_cost_per_hh, 0 as number_of_households, 0 as number_of_businesses, 0 as number_of_towers
            from
              client.location_entry_fees
            where
              location_id=$1

            UNION ALL

            select
              location_id, 0, install_cost, 0, 0, 0, 0
            from
              client.business_install_costs
            join businesses
              on businesses.id = business_install_costs.business_id
            where
              location_id=$1

            UNION ALL

            select
              location_id, 0, 0, install_cost_per_hh, 0, 0, 0
            from
              client.household_install_costs
            where
              location_id=$1

            union

            select
              location_id, 0, 0, 0, households.number_of_households, 0, 0
            from
              aro.households
            where
              households.location_id=$1

            UNION ALL

            select
              location_id, 0, 0, 0, 0, count(*), 0
            from
              businesses
            where
              location_id=$1
            group by
              location_id

            UNION ALL

            select
              location_id, 0, 0, 0, 0, 0, count(*)
            from
              towers
            where
              location_id=$1
            group by
              location_id

          ) t group by location_id;
        `
        return database.findOne(sql, [location_id], {})
      })
      .then((_info) => {
        info = _info
        info.customer_profile = {}
        info.customer_profile_totals = {}
        var sql

        var add = (type, values) => {
          info.customer_profile[type] = values
          info.customer_profile_totals[type] = values.reduce((total, item) => total + item.total, 0)
        }

        sql = `
          SELECT
            CASE WHEN bs.max_value < 100000000 THEN
              bs.size_name || ' (' || bs.min_value || ' - ' || bs.max_value || ' employees)'
            ELSE
              bs.size_name || ' (' || bs.min_value || '+ employees)'
            END AS name,
            COUNT(b.id)::integer AS total
          FROM client.businesses_sizes bs
          LEFT JOIN businesses b
            ON b.number_of_employees >= bs.min_value AND b.number_of_employees <= bs.max_value
            AND b.location_id=$1
          GROUP BY bs.size_name
          ORDER BY bs.min_value ASC
        `
        var businesses = database.query(sql, [location_id])
          .then((values) => add('businesses', values))

        sql = `
          SELECT
            ct.name, COUNT(*)::integer AS total
          FROM households h
          JOIN client.household_customer_types hct
            ON hct.household_id = h.id
          JOIN client.customer_types ct
            ON ct.id = hct.customer_type_id
          WHERE h.location_id=$1
          GROUP BY ct.id
        `
        var households = database.query(sql, [location_id])
          .then((values) => add('households', values))

        sql = `
          SELECT
            ct.name, COUNT(*)::integer AS total
          FROM towers t
          JOIN client.tower_customer_types tct
            ON tct.tower_id = t.id
          JOIN client.customer_types ct
            ON ct.id = tct.customer_type_id
          WHERE t.location_id=$1
          GROUP BY ct.id
        `
        sql = `
          SELECT 'Macro - Existing' as name, 0 as total
          UNION ALL
          SELECT 'Macro - Planned' as name, 0 as total
          UNION ALL
          SELECT 'Small Cell - Existing' as name, 0 as total
          UNION ALL
          SELECT 'Small Cell - Planned' as name, 0 as total
          UNION ALL
          SELECT 'Undefined' as name, (
            SELECT COUNT(*)::integer FROM towers t WHERE t.location_id=$1
          ) as total
        `
        var towers = database.query(sql, [location_id])
          .then((values) => add('towers', values))

        return Promise.all([businesses, households, towers])
      })
      .then(() => {
        var sql = `
          SELECT address, ST_AsGeojson(geog)::json AS geog,
            (SELECT ST_Distance(existing_fiber.geom::geography, locations.geog)
              FROM client.existing_fiber
              ORDER BY existing_fiber.geom <#> locations.geom ASC
              LIMIT 1
            ) AS distance_to_client_fiber,
            (SELECT ST_Distance(fr.geom::geography, locations.geog)
              FROM client.fiber_route fr
              WHERE fr.plan_id IN (
                (SELECT p.id FROM client.plan p WHERE p.parent_plan_id IN (
                  (SELECT id FROM client.plan WHERE parent_plan_id=$2)
                ))
              )
              ORDER BY fr.geom <#> locations.geom ASC
              LIMIT 1
            ) AS distance_to_planned_network
          FROM locations WHERE id=$1
        `
        return database.findOne(sql, [location_id, plan_id])
      })
      .then((location) => Object.assign(info, location))
  }

  static createLocation (values) {
    var location_id
    var type = values.type

    var total_households = +values.number_of_households || 0
    var total_businesses = type === 'combo' || type === 'commercial' ? 1 : 0
    var total_towers = 0

    return Promise.resolve()
      .then(() => {
        var params = [
          values.address,
          values.lat,
          values.lon,
          values.city,
          values.state,
          values.zipcode,
          `POINT(${values.lon} ${values.lat})`,
          `POINT(${values.lon} ${values.lat})`,
          total_households,
          total_businesses,
          total_towers
        ]
        var sql = `
          INSERT INTO aro.locations
            (address, lat, lon, city, state, zipcode, geog, geom, total_households, total_businesses, total_towers)
          VALUES ($1, $2, $3, $4, $5, $6, ST_GeogFromText($7), ST_GeomFromText($8, 4326), $9, $10, $11)
          RETURNING id
        `
        return database.findOne(sql, params)
      })
      .then((row) => {
        location_id = row.id

        if (type === 'commercial') {
          return insertBusiness()
        } else if (type === 'residential') {
          return insertHousehold()
        } else if (type === 'combo') {
          return Promise.all([insertBusiness(), insertHousehold()])
        }
      })
      .then(() => database.findOne('SELECT id, ST_AsGeoJSON(geog)::json AS geom, total_businesses, total_households FROM aro.locations WHERE id=$1', [location_id]))
      .then((row) => {
        return {
          'type': 'Feature',
          'properties': {
            'id': row.id,
            'total_businesses': row.total_businesses,
            'total_households': row.total_households
          },
          'geometry': row.geom
        }
      })

    function insertBusiness () {
      var business_id
      return Promise.resolve()
        .then(() => {
          var sql = `
            INSERT INTO businesses (location_id, industry_id, name, address, number_of_employees)
            VALUES ($1, $2, $3, $4, $5) RETURNING id
          `
          var params = [
            location_id,
            values.business_industry && values.business_industry.id,
            values.business_name,
            values.address,
            +values.number_of_employees
          ]
          return database.findOne(sql, params)
        })
        .then((row) => {
          business_id = row.id
          var sql = `
            INSERT INTO client.business_install_costs (business_id, install_cost, annual_recurring_cost)
            VALUES ($1, $2, $3)
          `
          var params = [
            business_id,
            +values.install_cost,
            +values.annual_recurring_cost
          ]
          return database.execute(sql, params)
        })
        .then(() => {
          var sql = `
            INSERT INTO client.business_customer_types (business_id, customer_type_id)
            VALUES ($1, $2)
          `
          var params = [
            business_id,
            values.business_customer_type && values.business_customer_type.id
          ]
          return database.execute(sql, params)
        })
    }

    function insertHousehold (callback) {
      var household_id
      return Promise.resolve()
        .then(() => {
          var sql = `
            INSERT INTO households (location_id, number_of_households)
            VALUES ($1, $2) RETURNING id
          `
          var params = [
            location_id,
            +values.number_of_households
          ]
          return database.findOne(sql, params)
        })
        .then((row) => {
          household_id = row.id
          var sql = `
            INSERT INTO client.household_customer_types (household_id, customer_type_id)
            VALUES ($1, $2)
          `
          var params = [
            household_id,
            values.household_customer_type && values.household_customer_type.id
          ]
          return database.execute(sql, params)
        })
    }
  }

  static findIndustries () {
    return database.query(`
      SELECT id, industry_name as description
      FROM client.industries
      ORDER BY industry_name ASC
    `)
  }

  static customerTypes () {
    return database.query(`
      SELECT * FROM client.customer_types
      ORDER BY name ASC
    `)
  }

  static updateHouseholds (location_id, values) {
    var params = [
      values.number_of_households,
      location_id
    ]
    return Promise.resolve()
      .then(() => {
        var sql = `
          UPDATE aro.households
          SET
            number_of_households = $1
          WHERE
            location_id = $2;
        `
        return database.execute(sql, params)
      })
      .then((rowCount) => {
        if (rowCount > 0) return 1
        var sql = `
          INSERT INTO aro.households
            (number_of_households, location_id)
          VALUES ($1, $2)
        `
        return database.execute(sql, params)
      })
  }

  static showBusinesses (location_id) {
    var sql = `
      SELECT
        businesses.id,
        businesses.industry_id,
        businesses.name,
        businesses.number_of_employees,
        businesses.address,
        costs.install_cost::float,
        costs.annual_recurring_cost::float,
        industries.description AS industry_description,
        ct.name as customer_type,
        bs.size_name
      FROM
        aro.businesses businesses
      LEFT JOIN client.business_install_costs costs
        ON costs.business_id = businesses.id
      LEFT JOIN industries
        ON industries.id = businesses.industry_id
      LEFT JOIN client.business_customer_types bct
        ON bct.business_id = businesses.id
      LEFT JOIN client.customer_types ct
        ON ct.id = bct.customer_type_id
      LEFT JOIN client.businesses_sizes bs
        ON businesses.number_of_employees >= bs.min_value AND businesses.number_of_employees <= bs.max_value
      WHERE
        location_id = $1
    `
    return database.query(sql, [location_id])
  }

  static showTowers (location_id) {
    var sql = `
      SELECT
        sita_number, parcel_address AS address
       FROM towers
      WHERE location_id = $1
    `
    return database.query(sql, [location_id])
  }

  // Get available filters
  static filters () {
    var output = {}
    return Promise.resolve()
      .then(() => database.query('SELECT * FROM client.employees_by_location'))
      .then((rows) => {
        output.employees_by_location = rows
        return database.query('SELECT * FROM client.industries')
      })
      .then((rows) => {
        output.industries = rows
        return database.query('SELECT * FROM client.customer_types')
      })
      .then((rows) => {
        output.customer_types = rows
        return database.query('SELECT * FROM client.products ORDER BY product_type, product_name')
      })
      .then((rows) => {
        output.products = rows
        return database.query('SELECT * FROM client.business_categories')
      })
      .then((rows) => {
        output.business_categories = rows
        return database.query('SELECT * FROM client.household_categories')
      })
      .then((rows) => {
        output.household_categories = rows
        return output
      })
  }

  static customerProfileHeatmap (viewport) {
    return Promise.resolve()
      .then(() => {
        var params = []
        var sql = `
          WITH ${viewport.fishnet}
          SELECT ST_AsGeojson(fishnet.geom)::json AS geom,
          -- existing customer
          (SELECT COUNT(*)::integer FROM businesses b
            JOIN client.business_customer_types bct
              ON b.id = bct.business_id
            JOIN client.customer_types ct
              ON ct.id = bct.customer_type_id AND ct.is_existing_customer
           WHERE b.geog && fishnet.geom) AS customer_type_existing,
          -- non existing customers
          (SELECT COUNT(*)::integer FROM businesses b
            JOIN client.business_customer_types bct
              ON b.id = bct.business_id
            JOIN client.customer_types ct
              ON ct.id = bct.customer_type_id AND NOT ct.is_existing_customer
           WHERE b.geog && fishnet.geom) AS customer_type_prospect
          FROM fishnet GROUP BY fishnet.geom
        `
        return database.query(sql, params)
      })
      .then((rows) => {
        rows = rows.filter((row) => row.customer_type_existing > 0 || row.customer_type_prospect > 0)

        var features = rows.map((row) => ({
          'type': 'Feature',
          'properties': {
            'id': row.id,
            'density': row.customer_type_prospect * 100 / (row.customer_type_existing + row.customer_type_prospect)
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

  static search (text) {
    var sql = `
      SELECT
        location_id, name, ST_AsGeoJSON(geog)::json AS geog
      FROM
        businesses
      WHERE lower(unaccent(name)) LIKE lower(unaccent($1))

      UNION ALL

      SELECT
        id AS location_id, address AS name, ST_AsGeoJSON(geog)::json AS geog
      FROM
        locations
      WHERE lower(unaccent(address)) LIKE lower(unaccent($1))

      LIMIT 100
    `
    return database.query(sql, [`%${text}%`])
  }

  static editUserDefinedCustomers (user, id, name, file) {
    return Promise.resolve()
      .then(() => {
        if (!id) {
          var req = {
            method: 'POST',
            url: config.aro_service_url + '/rest/user-entites',
            body: {
              name: name,
              userId: user.id
            },
            json: true
          }
          return models.AROService.request(req)
        } else {
          return Promise.resolve()
        }
      })
      .then((res) => {
        id = id || res.id
        if (!file) return { id: id }
        var req = {
          method: 'POST',
          url: config.aro_service_url + `/rest/user-entites/data/${id}/entities.csv`,
          formData: {
            file: fs.createReadStream(file)
          }
        }
        return models.AROService.request(req)
          .then(() => ({ id: id }))
      })
  }

  static towersByDataSource (dataSourceId, viewport) {
    return database.points(`
      SELECT geom FROM towers
      WHERE data_source_id = $1
      ${database.intersects(viewport, 'geom', 'AND')}
    `, [dataSourceId], true, viewport)
    .then((foo) => console.log('foo', foo) || foo)
  }
}
