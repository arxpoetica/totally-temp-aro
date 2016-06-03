// Location
//
// A Location is a point in space which can contain other objects such as businesses and households
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var config = helpers.config

module.exports = class Location {

  /*
  * Returns the businesses and households locations except the selected ones
  */
  static findLocations (plan_id, type, filters, viewport) {
    var where = {
      businesses: 'WHERE locations.total_businesses > 0',
      households: 'WHERE locations.total_households > 0',
      '': ''
    }
    var sql = `
        SELECT locations.id, locations.geom, total_businesses, total_households
          FROM locations
               ${where[type || '']}
        EXCEPT
        SELECT locations.id, locations.geom, total_businesses, total_households
          FROM locations
          JOIN client.plan_targets
            ON plan_targets.plan_id = $1
           AND plan_targets.location_id = locations.id
               ${where[type || '']}
      GROUP BY locations.id
    `
    return database.points(sql, [plan_id], true, viewport)
  }

  /*
  * Returns all the towers with a flag indicating if they are selected or not
  */
  static findTowers (plan_id, viewport) {
    let sql = `
        SELECT locations.id, locations.geom, MAX(plan_targets.id) IS NOT NULL AS selected
          FROM locations
          JOIN towers ON towers.location_id = locations.id
     LEFT JOIN client.plan_targets
            ON plan_targets.location_id=locations.id AND plan_targets.plan_id=$1
      GROUP BY locations.id
    `
    return database.points(sql, [plan_id], true, viewport)
  }

  /*
  * Returns the selected locations with businesses and households on them
  */
  static findSelected (plan_id, viewport) {
    var sql = `
      SELECT locations.id, locations.geom AS geom, true AS selected
        FROM aro.locations
        -- show only businesses and households. Do not show towers for example
        JOIN businesses b ON b.location_id = locations.id
        JOIN households h ON h.location_id = locations.id
        JOIN client.plan_targets
          ON plan_targets.plan_id = $1
         AND plan_targets.location_id = locations.id
    GROUP BY locations.id
    `
    return database.points(sql, [plan_id], true, viewport)
  }

  // Get summary information for a given location
  //
  // 1. location_id: integer. ex. 1738
  static showInformation (location_id) {
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
        var sql = `
          SELECT ct.name, SUM(households)::integer as households, SUM(businesses)::integer as businesses FROM (
            (SELECT
              bct.customer_type_id as id, COUNT(*)::integer AS businesses, 0 as households
            FROM
              businesses b
            JOIN
              client.business_customer_types bct
            ON
              bct.business_id = b.id
            WHERE
              b.location_id=$1
            GROUP BY bct.customer_type_id)

            UNION

            (SELECT
              hct.customer_type_id as id, 0 as businesses, COUNT(*)::integer AS households
            FROM
              households h
            JOIN
              client.household_customer_types hct
            ON
              hct.household_id = h.id
            WHERE
              h.location_id=$1
            GROUP BY hct.customer_type_id)

            ) t
          JOIN
            client.customer_types ct
          ON
            ct.id=t.id
          GROUP BY
            ct.name
          ORDER BY
            ct.name
        `
        return database.query(sql, [location_id])
      })
      .then((customer_types) => {
        info.customer_types = customer_types

        info.customers_businesses_total = customer_types
          .reduce((total, customer_type) => total + customer_type.businesses, 0)
        info.customers_households_total = customer_types
          .reduce((total, customer_type) => total + customer_type.households, 0)

        var sql = `
          SELECT address, ST_AsGeojson(geog)::json AS geog,
            (SELECT distance FROM client.locations_distance_to_carrier
              JOIN carriers ON carriers.name = $2
              WHERE location_id=locations.id
              LIMIT 1
            ) AS distance_to_client_fiber
          FROM locations WHERE id=$1
        `
        return database.findOne(sql, [location_id, config.client_carrier_name])
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
            'id': row.id
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
        ct.name as customer_type
      FROM
        aro.businesses businesses
      JOIN client.business_install_costs costs
        ON costs.business_id = businesses.id
      LEFT JOIN industries
        ON industries.id = businesses.industry_id
      JOIN client.business_customer_types bct
        ON bct.business_id = businesses.id
      JOIN client.customer_types ct
        ON ct.id = bct.customer_type_id
      WHERE
        location_id = $1
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

}
