// Location
//
// A Location is a point in space which can contain other objects such as businesses and households
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var config = helpers.config
var models = require('../models')
var fs = require('fs')
var hstore = require('pg-hstore')()
var stringify = require('csv-stringify')

module.exports = class Location {

  /*
  * Returns the businesses and households locations except the selected ones
  */
  static findLocations (plan_id, viewport, categoryFilters, showTowers,
                        useGlobalBusinessDataSource, useGlobalHouseholdDataSource, useGlobalCellTowerDataSource,
                        uploadedDataSources) {
    // For Businesses - Create arrays to be sent as SQL parameters (can't send empty arrays to SQL)
    var businessCategories = ['']
    var businessDataSources = [-1]
    var getBusinesses = categoryFilters.businessCategories.length > 0 && (useGlobalBusinessDataSource || uploadedDataSources.length > 0)
    if (getBusinesses) {
      businessCategories = categoryFilters.businessCategories
      businessDataSources = uploadedDataSources.slice()
      if (useGlobalBusinessDataSource) {
        businessDataSources.push(1)
      }
    }

    // For Households - Create arrays to be sent as SQL parameters (can't send empty arrays to SQL)
    var householdCategories = ['']
    var householdDataSources = [-1]
    var getHouseholds = categoryFilters.householdCategories.length > 0 && (useGlobalHouseholdDataSource || uploadedDataSources.length > 0)
    if (getHouseholds) {
      householdCategories = categoryFilters.householdCategories
      householdDataSources = uploadedDataSources.slice()
      if (useGlobalHouseholdDataSource) {
        householdDataSources.push(1)
      }
    }

    // For CellTowers - Create arrays to be sent as SQL parameters (can't send empty arrays to SQL)
    var cellTowerDataSources = [-1]
    var getCellTowers = showTowers && (useGlobalCellTowerDataSource || uploadedDataSources.length > 0)
    if (getCellTowers) {
      cellTowerDataSources = uploadedDataSources.slice()
      if (useGlobalCellTowerDataSource) {
        cellTowerDataSources.push(1)
      }
    }

    var sql = `
      WITH view_window AS (
        SELECT ST_SetSRID(ST_MakePolygon(ST_GeomFromText('${viewport.linestring}')), 4326) AS geog
      ),
      states AS (
        SELECT st.stusps
        FROM aro.states st
        JOIN view_window vw
          ON ST_Intersects(cast(vw.geog AS GEOMETRY), st.geom)
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

        ${plan_id ? `LEFT JOIN client.plan_targets pt
          ON pt.location_id = l.id
          AND pt.plan_id = $6` : ''}

        LEFT JOIN aro.towers t
          ON t.location_id = l.id
          AND t.data_source_id IN ($5)

        LEFT JOIN client.basic_classified_business b
          ON b.location_id = l.id
          AND b.category_name IN ($1) and b.data_source_id IN ($3)

        LEFT JOIN client.basic_classified_household h
          ON h.location_id = l.id
          AND h.category_name IN ($2) and h.data_source_id IN ($4)

        WHERE (t.id IS NOT NULL OR b.id IS NOT NULL OR h.id IS NOT NULL) ${plan_id ? `AND pt.location_id IS NULL` : ''}
        GROUP BY 1,2
      )
    `
    var params = [
      businessCategories,
      householdCategories,
      businessDataSources,
      householdDataSources,
      cellTowerDataSources
    ]
    if(plan_id) {
      params.push(plan_id);
    }
    return database.points(sql, params, true, viewport)
  }

  static findVisibleLocations(plan_id, filters) {

	 var uploadedDataSources = filters.uploaded_datasources
	 if (uploadedDataSources.length === 0) uploadedDataSources = [-1]
	  var sql = `
	      WITH locations_datasource AS (
	        SELECT l.*
	        FROM aro.locations l
	        JOIN aro.businesses b
	        on b.location_id = l.id and b.source is null and b.data_source_id in ($1)
	        
	        UNION
	        
	        SELECT l.*
	        FROM aro.locations l
	        JOIN aro.towers t
	        ON t.location_id = l.id
	        AND t.data_source_id IN ($1)
		  ),
		  features AS (
		    SELECT l.id, l.geom
		    FROM locations_datasource l
		    GROUP BY 1,2
		  )
		 `
	    var params = [uploadedDataSources]
	    return database.visiblepoints(sql, params, true)
	}

  /*
   * Returns a list of location IDs that are selected for this plan and the given viewport
   */
  static findSelectedLocationIds(planId) {
    var sql = `
      SELECT location_id
      FROM client.plan_targets
      WHERE plan_id=$1
    `
    return database.query(sql, [planId])
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
      .then((output) => {
        if (output.feature_collection.features.length < 200) return output
        viewport.threshold = 100
        viewport.buffer *= 10
        return database.points(sql, [plan_id], true, viewport, true)
      })
  }

  // Get summary information for a given location
  static showInformation (plan_id, location_id) {
    var info,locationInfo,locationSources
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
              location_id, 0, 0, 0, sum(households.number_of_households), 0, 0
            from
              aro.households
            where
              households.location_id=$1
            group by
              location_id  

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

        var condition1 = ''
        var condition2 = ''	
        if (config.ui.locations_modal && config.ui.locations_modal.businesses && config.ui.locations_modal.businesses.floor) {
        	condition1 = `
        		bs.size_name || ' (' || bs.min_value || ' - ' || bs.max_value || ' floors)'
        	`
        	condition2 = `
        		bs.size_name || ' (' || bs.min_value || '+ floors)'
        	`
        } else {
        condition1 = `
    		bs.size_name || ' (' || bs.min_value || ' - ' || bs.max_value || ' employees)'
    	`
    	condition2 = `
    		bs.size_name || ' (' || bs.min_value || '+ employees)'
    	`
        }
        sql = `
          SELECT
            CASE WHEN bs.max_value < 9999999 THEN
            (initcap(bs.name) || ' (' || bs.min_value || ' - ' || bs.max_value || ' employees)')
            ELSE
            (initcap(bs.name) || ' (' || bs.min_value || '+ employees)')
            END AS name,
            COUNT(b.id)::integer AS total
          FROM client.business_categories bs
          LEFT JOIN businesses b
            ON b.number_of_employees >= bs.min_value AND b.number_of_employees <= bs.max_value
            AND b.location_id=$1
          GROUP BY bs.name,bs.max_value,bs.min_value
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
          SELECT address,zipcode,city, ST_AsGeojson(geog)::json AS geog,cb.tabblock_id, cb.name,
            (SELECT min(ST_Distance(ef_closest_fibers.geom::geography, locations.geog))
              FROM (
                SELECT geom
                FROM client.existing_fiber
                ORDER BY existing_fiber.geom <#> locations.geom ASC
                LIMIT 10
              ) as ef_closest_fibers
            ) AS distance_to_client_fiber
          FROM locations 
          JOIN aro.census_blocks cb ON ST_Contains(cb.geom,locations.geom)
          WHERE locations.id=$1
        `
        return database.findOne(sql, [location_id])
      })
      .then((_location) => {
        locationInfo = _location
        locationSources = {} 
        var hhSources = `
            SELECT array_agg(object_id) as object_ids FROM households
            WHERE location_id=$1
        `
        var hhSourceIds = database.findOne(hhSources, [location_id])
          .then((values) => {
            locationSources.hhSourceIds = values
          })

        var bizSources = `
          SELECT array_remove(array_agg(object_id), null) as object_ids FROM businesses
          WHERE location_id=$1
        `
        var bizSourceIds = database.findOne(bizSources, [location_id])
          .then((values) => {
            locationSources.bizSourceIds = values
          })

        var towerSources = `
          SELECT array_agg(object_id) as object_ids FROM towers
          WHERE location_id=$1
        `
        var towerSourceIds = database.findOne(towerSources, [location_id])
          .then((values) => {
            locationSources.towerSourceIds = values
          })

        return Promise.all([hhSourceIds, bizSourceIds, towerSourceIds])
      })
      .then(()=> {

        var attributeQuery = `
          SELECT attributes FROM businesses
          WHERE location_id=$1
        `
        return database.findOne(attributeQuery, [location_id])
      })
      .then((result)=>{
        if (!result || !result.attributes) {
          locationInfo.attributes = []
          return Promise.resolve() // There are no attributes for households, celltowers
        } else {
          locationInfo.attributes = []
          let order_property_string = 'business_attribute_order_' + process.env.ARO_CLIENT.toString().toLowerCase()
          let order_property_query = `select spf.name, sp.string_value from client.system_property sp join client.system_rule sr on sp.system_rule_id = sr.id join client.system_property_field spf on sp.property_field_id = spf.id where spf.name = \'${order_property_string}\'`
          return database.findOne(order_property_query)
            .then((order)=>{
              hstore.parse(result.attributes, function (result) {
                if (order) {
                  let order_array = JSON.parse(order.string_value)
                  let last_index = order_array.length
                  let index = -1
                  for (let k in result) {
                    if (order_array.indexOf(k) !== -1) {
                      index = order_array.indexOf(k)
                    } else {
                      index = last_index
                      last_index++
                    }
                    locationInfo.attributes[index] = {
                      key: k,
                      value: result[k]
                    }
                  }
                } else {
                  for (let k in result) {
                    locationInfo.attributes.push({
                      key: k,
                      value: result[k]
                    })
                  }
                }
              })
            })
        }
      })
      .then(() => {
        locationInfo.locSourceIds = locationSources
        return Object.assign(info, locationInfo)
      })
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

  static showHouseholds (location_id) {
    var sql = `
      SELECT
        address
       FROM households
      WHERE location_id = $1
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
            url: config.aro_service_url + '/installed/consumer/files',
            headers:{
              "Accept":"*/*"
            },
            qs: {
              'name': name,
              'user_id': user.id
            },
            formData: {
              file: fs.createReadStream(file)
            }
          }
          return models.AROService.request(req)
        } else {
          return Promise.resolve()
        }
      });
  }

  static towersByDataSource (dataSourceId, viewport) {
    return database.points(`
      SELECT geom FROM towers
      WHERE data_source_id = $1
      ${database.intersects(viewport, 'geom', 'AND')}
    `, [dataSourceId], true, viewport)
    .then((foo) => console.log('foo', foo) || foo)
  }

  static saveMorphology (user, tileSystemId, projectId, name, file, mappings) {
    var maps = mappings.mappings;
    var default_imp = mappings.default[0];

    var url = `${config.aro_service_url}/tile-system/${tileSystemId}/files`;
    if(maps.length > 0){
      var mapstr = "";
      maps.forEach((mapping)=>{
        mapstr += "mapping="+mapping.code+":"+mapping.value
        mapstr += "&";
      });

      mapstr += "nodata_value="+default_imp.value;
      url = url + "?" +mapstr;
    }
    url = url + `&project_id=${projectId}`
    return Promise.resolve()
      .then(() => {
        if (tileSystemId) {
          var req = {
            method: 'POST',
            url: url,
            headers:{
              "Accept":"*/*"
            },
            formData: {
              file: fs.createReadStream(file)
            }
          }
          return models.AROService.request(req)
        } else {
          return Promise.resolve()
        }
      });
  }

  static exportAsCSV(polygon, planId) {
    if(polygon.length === 0)
        return ""

    return Promise.resolve()
    .then(()=>{
      var polyJSON = JSON.stringify({"type":"Polygon","coordinates": [polygon] })
      // Hardcoding quickfix for frontier - #159551834
      const HARDCODED_DATA_SOURCE_FOR_FRONTIER_QUICKFIX = 30
      var sql = `
          WITH inputs AS (
          SELECT   
            '${polyJSON}' AS geojson,
            ${planId} AS root_plan_id
          ),
          output AS (
            SELECT
            l.object_id AS "Location Object ID",
            g.name AS "Data Source",
            CASE WHEN l.location_category = 0 THEN 'Business' WHEN l.location_category = 1 THEN 'Household' ELSE 'Tower' END AS "Location Type",
            l.number_of_households AS "Location Count",
            ST_Y(l.geom) AS "Location Latitude",
            ST_X(l.geom) AS "Location Longitude",
            ST_Y(l.geom) || ' ' || ST_X(l.geom) AS "Lat Long Concat",
            s.name AS "Wirecenter Name",
            s.code AS "Wirecenter CLLI",
            '="' || c.tabblock_id || '"' AS "Census Block",
            (SELECT description FROM aro_core.tag WHERE id = ((c.tags->'category_map'->>(SELECT id FROM aro_core.category WHERE description = 'CAF Phase I Part I')::text)::int)) AS "CAF Phase I Part I Tag",
            (SELECT description FROM aro_core.tag WHERE id = ((c.tags->'category_map'->>(SELECT id FROM aro_core.category WHERE description = 'CAF Phase I Part II')::text)::int)) AS "CAF Phase I Part II Tag",
            (SELECT description FROM aro_core.tag WHERE id = ((c.tags->'category_map'->>(SELECT id FROM aro_core.category WHERE description = 'CAF Phase II')::text)::int)) AS "CAF Phase II Tag"
            FROM inputs i
            JOIN aro.location_entity l ON ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON(i.geojson),4326), l.geom) AND l.date_to = '294276-01-01 00:00:00'::date AND l.data_source_id = ${HARDCODED_DATA_SOURCE_FOR_FRONTIER_QUICKFIX}
            LEFT JOIN client.service_area s ON ST_Intersects(s.geom,ST_SetSRID(ST_GeomFromGeoJSON(i.geojson),4326)) AND ST_Contains(s.geom,l.geom) AND s.service_layer_id = 1
            JOIN aro_core.global_library g ON g.data_source_id = l.data_source_id
            JOIN aro.census_blocks c ON l.cb_gid = c.gid
          )
          SELECT *
          FROM output
      `
      
      return database.query(sql)
    }).then((results)=>{

      //Flatten HSTORE
      //Create a list of unique columns for all locations

      let columns = new Set()
      let newResults = []

      results.forEach((l) => {
        if (l.attributes) {
          hstore.parse(l.attributes, function (result) {
            l = Object.assign(l, result)
            delete l.attributes

            for(let key in l) {
              if (l.hasOwnProperty(key)) {
                columns.add(key)
              }
            }
          })
        }
        newResults.push(l)
      })

      //check each row for missing columns and add if missing and set to null
      newResults.map((l)=>{
        columns.forEach(function(val ,val2 ,set){
          if (!(val in l))  {
            l[val] = null
          }
        })
      })
      return newResults
    })
    .then((results)=>{
      //send response as csv
      var json2csv = require("json2csv");
      return json2csv({data:results});
    })
  }
}
