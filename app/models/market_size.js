// MarketSize
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var stringify = require('csv-stringify')
var _ = require('underscore')
var moment = require('moment')
var config = require('../helpers').config
var Network = require('./network')
var pync = require('pync')

const emptyArray = (arr) => !Array.isArray(arr) || arr.length === 0

module.exports = class MarketSize {
  static _prepareMarketSizeQuery (plan_id, type, options, params) {
    var filters = options.filters

    var customerTypeFilter = () => {
      if (!filters || !filters.customer_type) return ''
      params.push(filters.customer_type)
      return `
         JOIN client.business_customer_types bct
          ON bct.business_id = b.id
         AND bct.customer_type_id=$${params.length}
       `
    }

    var boundaryConstraint = (op) => {
      if (options.boundary) {
        params.push(options.boundary)
        return ` WHERE ST_Intersects(ST_SetSRID(ST_GeomFromGeoJSON($${params.length})::geometry, 4326), b.geom)`
      } else if (options.viewport) {
        return ' WHERE ' + database.intersects(options.viewport, 'b.geom', '')
      } else {
        return ''
      }
    }

    type = type || 'all'

    if (type === 'all') {
      return `
        WITH biz AS (
          SELECT b.id, b.industry_id, b.number_of_employees, b.location_id, b.name, b.address, b.geog, b.geom
          FROM businesses b
          ${customerTypeFilter()} ${boundaryConstraint()}
        )
      `
    } else if (type === 'existing') {
      params.push(config.client_carrier_name)
      return `
        WITH biz AS
        (SELECT b.id, b.industry_id, b.number_of_employees, b.location_id, b.name, b.address, b.geog
          FROM businesses b
          JOIN network_provider.carrier ON carriers.name = $${params.length}
          JOIN aro.fiber_plant
            ON fiber_plant.carrier_id = carriers.id
           AND ST_Intersects(fiber_plant.buffer_geom, b.geom)
               ${customerTypeFilter()} ${boundaryConstraint()}
        )
      `
    } else if (type === 'plan') {
      params.push(plan_id)
      return `
        WITH biz AS (
          SELECT b.id, b.industry_id, b.number_of_employees, b.location_id, b.name, b.address, b.geog
          FROM businesses b
          JOIN locations l ON b.location_id = l.id
          JOIN client.plan_targets pt ON pt.location_id = l.id AND pt.plan_id = $${params.length}
          ${customerTypeFilter()} ${boundaryConstraint()}
        )
      `
    }
    return null
  }

  static _createBusinessesCsv (plan_id, user, rows, filters, carriers) {
    var years = []
    var total
    var csv, products, employees_by_location, industries
    return Promise.resolve()
      .then(() => {
        rows.forEach((business) => {
          if (years.indexOf(business.year) === -1) {
            years.push(business.year)
          }
        })
        years = years.sort()
        var columns = ['name', 'address']
          .concat(carriers.map((carrier) => 'distance_' + carrier.id))
          .concat(['industry_name', 'industry_description', 'number_of_employees', 'type'])
          .concat(years)
        var businesses = {}
        rows.forEach((business) => {
          var id = business.id
          business[business.year] = business.total
          businesses[id] = _.extend(businesses[id] || {}, business)
        })
        businesses = _.values(businesses)
        var year = String(new Date().getFullYear())
        total = businesses.reduce((total, business) => total + (business[year] || 0), 0)
        businesses = _.values(businesses).map((business) => columns.map((col) => business[col]))
        console.log('Market size total for current year:', total)
        return new Promise((resolve, reject) => {
          stringify(businesses, (err, csv) => {
            err ? reject(err) : resolve(csv)
          })
        })
      })
      .then((_csv) => {
        csv = _csv
        var header = ['Name', 'Address']
          .concat(carriers.map((carrier) => 'Distance to ' + carrier.name))
          .concat(['Industry name', 'Industry description', 'Number of employees', 'Type'])
          .concat(years)
        csv = header.join(',') + '\n' + csv

        if (emptyArray(filters.product)) return []
        var sql = 'SELECT product_type, product_name FROM client.products WHERE id IN($1)'
        return database.query(sql, [filters.product])
      })
      .then((_products) => {
        products = _products
        if (emptyArray(filters.employees_range)) return []
        var sql = 'SELECT value_range FROM client.employees_by_location WHERE id IN($1)'
        return database.query(sql, [filters.employees_range])
      })
      .then((_employees_by_location) => {
        employees_by_location = _employees_by_location
        if (emptyArray(filters.industry)) return []
        var sql = 'SELECT industry_name FROM client.industries WHERE id IN($1)'
        return database.query(sql, [filters.industry])
      })
      .then((_industries) => {
        industries = _industries
        var sql = 'SELECT name, area_name FROM client.active_plan WHERE id=$1'
        return database.findOne(sql, [plan_id])
      })
      .then((plan) => {
        var footer = []
        footer.push(['Export Attributes'])
        if (user) {
          footer.push(['Created by:', user.first_name + ' ' + user.last_name])
        }
        footer.push(['Created on:', moment().format('MMMM Do YYYY, h:mm:ss a')])
        footer.push([])
        footer.push(['User-specified Inputs'])
        footer.push(['Network plan:', plan.name])
        footer.push(['Geography:', plan.area_name])
        footer.push([])
        if (industries.length > 0) {
          footer.push(['Industries Included In Market Sizing'])
          industries.forEach((industry) => footer.push(['', industry.industry_name]))
          footer.push([])
        }
        if (products.length > 0) {
          footer.push(['Products Included In Market Sizing'])
          products.forEach((product) => footer.push(['', product.product_type, product.product_name]))
          footer.push([])
        }
        if (employees_by_location.length > 0) {
          footer.push(['Employee Ranges Included In Market Sizing'])
          employees_by_location.forEach((range) => footer.push(['', range.value_range]))
          footer.push([])
        }
        footer.push([])
        return new Promise((resolve, reject) => {
          stringify(footer, (err, csv) => {
            err ? reject(err) : resolve(csv)
          })
        })
      })
      .then((footer) => {
        return {
          csv: footer + csv,
          total: total
        }
      })
  }

  // Get available filters
  static filters () {
    var output = {}
    return Promise.resolve()
      .then(() => {
        return database.query('SELECT * FROM client.products')
      })
      .then((rows) => {
        output.products = rows
        return database.query('SELECT * FROM client.industries')
      })
      .then((rows) => {
        output.industries = rows
        return database.query('SELECT * FROM client.customer_types')
      })
      .then((rows) => {
        output.customer_types = rows
        return database.query('SELECT * FROM client.employees_by_location')
      })
      .then((rows) => {
        output.employees_by_location = rows
        return output
      })
  }

  static calculate (plan_id, type, options) {
    var filters = options.filters
    var output = {}

    return Promise.resolve()
      .then(() => {
        var params = []
        var sql = this._prepareMarketSizeQuery(plan_id, type, options, params)

        sql += `
          , counts AS (
              SELECT m.industry_id, e.id AS employees_by_location_id, COUNT(*) as total
                FROM biz b
                JOIN client.industry_mapping m
                  ON m.sic4 = b.industry_id
        `

        if (!emptyArray(filters.industry)) {
          params.push(filters.industry)
          sql += `\n AND m.industry_id IN ($${params.length})`
        }

        sql += `
                JOIN client.employees_by_location e
                  ON e.min_value <= b.number_of_employees
                 AND e.max_value >= b.number_of_employees
         `

        if (!emptyArray(filters.employees_range)) {
          params.push(filters.employees_range)
          sql += `\n AND e.id IN ($${params.length})`
        }

        sql += `
            GROUP BY m.industry_id, e.id
          )

            SELECT spend.year, SUM(spend.monthly_spend * c.total * 12)::float as total
              FROM counts c
              JOIN client.spend
                ON c.industry_id = spend.industry_id
               AND c.employees_by_location_id = spend.employees_by_location_id
         `
        if (!emptyArray(filters.product)) {
          params.push(filters.product)
          sql += `\n AND spend.product_id IN ($${params.length})`
        }

        if (config.spend_by_city) {
          params.push(plan_id)
          sql += `
             JOIN cities
               ON spend.city_id = cities.id
              AND cities.buffer_geog && b.geog
              AND cities.id = (
                SELECT cities.id FROM cities
                JOIN client.active_plan r ON r.id = $${params.length}
                ORDER BY r.area_centroid <#> cities.buffer_geog::geometry
                LIMIT 1
              )
           `
        }
        sql += `
          GROUP BY spend.year
          ORDER BY spend.year ASC
        `
        return database.query(sql, params)
      })
      .then((market_size) => {
        output.market_size = market_size
        return MarketSize.fairShare(plan_id, type, options)
      })
      .then((fairShare) => {
        output.fair_share = fairShare
        output.market_size_existing = [] // TODO

        var current_carrier
        var total = output.fair_share.reduce((total, item) => {
          if (item.name === config.client_carrier_name) {
            current_carrier = item.value
          }
          return item.value + total
        }, 0)
        output.share = current_carrier / total
        return output
      })
  }

  static fairShare (plan_id, type, options) {
    var filters = options.filters
    var params = []
    var sql = this._prepareMarketSizeQuery(plan_id, type, options, params)
    sql += `
      SELECT MAX(c.name) AS name, COUNT(*)::integer AS value,
      '#' ||
        to_hex(cast(random()*16 as int)) || to_hex(cast(random()*16 as int)) || to_hex(cast(random()*16 as int)) ||
        to_hex(cast(random()*16 as int)) || to_hex(cast(random()*16 as int)) || to_hex(cast(random()*16 as int))
      AS color
      FROM biz
      JOIN aro.fiber_plant r ON st_contains(r.buffer_geom, biz.geom)
      JOIN network_provider.carrier c ON r.carrier_id = c.id
      JOIN locations l ON l.id = biz.location_id
        ${filters.entity_type === 'households' ? 'AND c.route_type=\'ilec\'' : ''}
        ${filters.entity_type === 'businesses' ? 'AND c.route_type=\'fiber\'' : ''}
        GROUP BY c.id ORDER BY c.name
    `
    return database.query(sql, params)
      .then((fairShare) => {
        this._sortFairShare(fairShare)
        return fairShare
      })
  }

  static exportBusinesses (plan_id, type, options, user) {
    var filters = options.filters
    var output = {}

    return Network.carriers(plan_id, 'fiber')
      .then((carriers) => {
        output.carriers = carriers

        var params = []
        var sql = this._prepareMarketSizeQuery(plan_id, type, options, params)
        sql += `
          b.id AS business_id FROM biz b)

          SELECT
            b.id,
            MAX(b.location_id) AS location_id,
            MAX(b.name) AS name,
            MAX(b.address) AS address,
            MAX(c_industries.industry_name) AS industry_name,
            MAX(industries.description) AS industry_description,
            MAX(e.value_range) AS number_of_employees,
            MAX(ct.name) AS type,
        `
        carriers.forEach((carrier) => {
          sql += `
            MIN(d.distance_${carrier.id}) AS distance_${carrier.id},
          `
        })
        sql += `
            SUM(spend.monthly_spend * 12)::float as total,
            spend.year
          FROM
            biz b
          JOIN locations l ON b.location_id = l.id
          JOIN distances d ON d.business_id = b.id
          JOIN industries ON industries.id = b.industry_id
          JOIN client.business_customer_types bct ON bct.business_id = b.id
          JOIN client.customer_types ct ON ct.id=bct.customer_type_id
        `
        if (filters.customer_type) {
          params.push(filters.customer_type)
          sql += `AND bct.customer_type_id=$${params.length}`
        }
        sql += `
          JOIN
            client.industry_mapping m
          ON
            m.sic4 = b.industry_id
          JOIN
            client.spend
          ON
            spend.industry_id = m.industry_id
            AND spend.monthly_spend <> 'NaN'
        `

        if (!emptyArray(filters.industry)) {
          params.push(filters.industry)
          sql += ` AND spend.industry_id IN ($${params.length})`
        }
        if (!emptyArray(filters.product)) {
          params.push(filters.product)
          sql += ` AND spend.product_id IN ($${params.length})`
        }
        if (!emptyArray(filters.employees_range)) {
          params.push(filters.employees_range)
          sql += ` AND spend.employees_by_location_id IN ($${params.length})`
        }
        sql += `
          JOIN
            client.employees_by_location e
          ON
            e.id = spend.employees_by_location_id
            AND e.min_value <= b.number_of_employees
            AND e.max_value >= b.number_of_employees
        `
        if (config.spend_by_city) {
          sql += '\n JOIN cities ON spend.city_id = cities.id AND cities.buffer_geog && b.geog'
        }
        sql += `
          JOIN
            client.industries c_industries
          ON
            spend.industry_id = c_industries.id
          GROUP BY b.id, year
        `
        return database.query(sql, params)
      })
      .then((rows) => (
        this._createBusinessesCsv(plan_id, user, rows, filters, output.carriers)
      ))
  }

  static exportBusinessesAtLocation (plan_id, location_id, type, options, user) {
    var filters = options.filters
    var output = {}

    return Network.carriers(plan_id, 'fiber')
      .then((carriers) => {
        output.carriers = carriers

        var params = [location_id]
        var sql = 'WITH biz AS (SELECT * FROM businesses b WHERE b.location_id=$1)\n'

        sql += `
          b.id AS business_id FROM biz b)

          SELECT
            b.id,
            MAX(b.name) AS name,
            MAX(b.address) AS address,
            MAX(c_industries.industry_name) AS industry_name,
            MAX(industries.description) AS industry_description,
            MAX(e.value_range) AS number_of_employees,
            MAX(ct.name) AS type,
        `
        carriers.forEach((carrier) => {
          sql += `
            MIN(d.distance_${carrier.id}) AS distance_${carrier.id},
          `
        })
        sql += `
            SUM(spend.monthly_spend * 12)::float as total,
            spend.year
          FROM
            biz b
          JOIN locations l ON b.location_id = l.id
          JOIN industries ON industries.id = b.industry_id
          JOIN client.business_customer_types bct ON bct.business_id = b.id
          JOIN client.customer_types ct ON ct.id=bct.customer_type_id
        `
        if (filters.customer_type) {
          params.push(filters.customer_type)
          sql += `\n AND bct.customer_type_id=${params.length}`
        }
        sql += `
          JOIN
            client.industry_mapping m
          ON
            m.sic4 = b.industry_id
          JOIN
            client.spend
          ON
            spend.industry_id = m.industry_id
            AND spend.monthly_spend <> 'NaN'
        `

        if (!emptyArray(filters.industry)) {
          params.push(filters.industry)
          sql += ` AND spend.industry_id IN ($${params.length})`
        }
        if (!emptyArray(filters.product)) {
          params.push(filters.product)
          sql += ` AND spend.product_id IN ($${params.length})`
        }
        if (!emptyArray(filters.employees_range)) {
          params.push(filters.employees_range)
          sql += ` AND spend.employees_by_location_id IN ($${params.length})`
        }
        sql += `
          JOIN
            client.employees_by_location e
          ON
            e.id = spend.employees_by_location_id
            AND e.min_value <= b.number_of_employees
            AND e.max_value >= b.number_of_employees
        `
        if (config.spend_by_city) {
          sql += `
             JOIN cities
             ON spend.city_id = cities.id
             AND cities.buffer_geog && b.geog
          `
        }
        sql += `
          JOIN
            client.industries c_industries
          ON
            spend.industry_id = c_industries.id
          GROUP BY b.id, year
        `
        return database.query(sql, params)
      })
      .then((rows) => (
        this._createBusinessesCsv(plan_id, user, rows, filters, output.carriers)
      ))
  }

  static marketSizeForLocation (location_id, filters) {
    var output = {}

    return Promise.resolve()
      .then(() => {
        var params = [location_id]
        var sql = `
          SELECT spend.year, SUM(spend.monthly_spend * 12)::float as total
          FROM aro.locations locations
          JOIN businesses b ON locations.id = b.location_id
          -- JOIN client.business_customer_types bct ON bct.business_id = b.id
          -- JOIN client.customer_types ct ON ct.id=bct.customer_type_id
        `
        if (filters.customer_type) {
          params.push(filters.customer_type)
          sql += `\n AND bct.customer_type=$${params.length}`
        }
        sql += `
          JOIN client.industry_mapping m ON m.sic4 = b.industry_id
          JOIN client.spend ON spend.industry_id = m.industry_id
        `
        if (!emptyArray(filters.industry)) {
          params.push(filters.industry)
          sql += ` AND spend.industry_id IN ($${params.length})`
        }
        if (!emptyArray(filters.product)) {
          params.push(filters.product)
          sql += ` AND spend.product_id IN ($${params.length})`
        }
        if (!emptyArray(filters.employees_range)) {
          params.push(filters.employees_range)
          sql += ` AND spend.employees_by_location_id IN ($${params.length})`
        }
        sql += `
          JOIN client.employees_by_location e ON
                e.id = spend.employees_by_location_id
            AND e.min_value <= b.number_of_employees
            AND e.max_value >= b.number_of_employees
         `
        if (config.spend_by_city) {
          sql += `
            JOIN cities
              ON spend.city_id = cities.id
             AND cities.buffer_geog && b.geog
          `
        }
        sql += `
          WHERE locations.id = $1
          GROUP BY spend.year
          ORDER by spend.year
        `
        return database.query(sql, params)
      })
      .then((market_size) => {
        output.market_size = market_size
        return output
      })
  }

  static marketSizeForBusiness (business_id, options) {
    var output = {}
    var filters = options.filters

    return Promise.resolve()
      .then(() => {
        var params = [business_id]
        var sql = `
          SELECT spend.year, SUM(spend.monthly_spend * 12)::float as total
          FROM aro.locations locations
          JOIN businesses b ON locations.id = b.location_id
          -- JOIN client.business_customer_types bct ON bct.business_id = b.id
          -- JOIN client.customer_types ct ON ct.id=bct.customer_type_id
          JOIN client.industry_mapping m ON m.sic4 = b.industry_id
          JOIN client.spend ON spend.industry_id = m.industry_id
        `
        if (!emptyArray(filters.product)) {
          params.push(filters.product)
          sql += `\n AND spend.product_id IN ($${params.length})`
        }
        sql += `
          JOIN client.employees_by_location e ON
            e.id = spend.employees_by_location_id
            AND e.min_value <= b.number_of_employees
           AND e.max_value >= b.number_of_employees
        `
        if (config.spend_by_city) {
          sql += `
            JOIN cities
              ON spend.city_id = cities.id
             AND cities.buffer_geog && b.geog
          `
        }
        sql += `
          WHERE b.id = $1
          GROUP BY spend.year
          ORDER by spend.year
        `
        return database.query(sql, params)
      })
      .then((market_size) => {
        output.market_size = market_size
        return output
      })
  }

  static fairShareHeatmap (viewport) {
    return database.findOne('SELECT id FROM carriers WHERE name=$1', [config.client_carrier_name])
      .then((carrier) => {
        var params = [carrier.id]
        var sql = `
          WITH ${viewport.fishnet}
          SELECT ST_AsGeojson(fishnet.geom)::json AS geom

          , (SELECT COUNT(*)::integer FROM businesses biz
          JOIN locations ON fishnet.geom && locations.geom
          JOIN client.location_competitors lc ON lc.location_id = biz.location_id
          JOIN network_provider.carrier c ON lc.carrier_id = c.id AND c.id = $1
          WHERE biz.location_id = locations.id) AS carrier_current

          , (SELECT COUNT(*)::integer FROM businesses biz
          JOIN locations ON fishnet.geom && locations.geom
          JOIN client.location_competitors lc ON lc.location_id = biz.location_id
          JOIN network_provider.carrier c ON lc.carrier_id = c.id
          WHERE biz.location_id = locations.id) AS carrier_total

          FROM fishnet GROUP BY fishnet.geom
        `
        return database.query(sql, params)
      })
      .then((rows) => {
        rows = rows.filter((row) => row.carrier_total > 0)

        var features = rows.map((row) => ({
          'type': 'Feature',
          'properties': {
            'id': row.id,
            'density': row.carrier_total === 0 ? 0 : (row.carrier_current * 100 / row.carrier_total),
            'carrier_total': row.carrier_total,
            'carrier_current': row.carrier_current
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

}
