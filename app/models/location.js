// Location
//
// A Location is a point in space which can contain other objects such as businesses and households
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var hstore = require('pg-hstore')()

module.exports = class Location {

  // FIXME: legacy code, transfer to service
  // Get summary information for a given location
  static async showInformation (plan_id, location_id) {

        const info_sql = `
          select
            location_id,
            sum(entry_fee)::integer as entry_fee,
            sum(install_cost)::integer as business_install_costs,
            sum(install_cost_per_hh)::integer as household_install_costs,
            sum(number_of_households)::double precision as number_of_households,
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
              location_id, 0, 0, 0, sum(households.number_of_households::double precision), 0, 0
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
        const info = await database.findOne(info_sql, [location_id], {})
        info.customer_profile = {}
        info.customer_profile_totals = {}

        const add = (type, values) => {
          info.customer_profile[type] = values
          info.customer_profile_totals[type] = values.reduce((total, item) => total + item.total, 0)
        }

        const businesses_values = await database.query(`
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
        `, [location_id])
        add('businesses', businesses_values)

        const households_values = await database.query(`
          SELECT
            ct.name, COUNT(*)::double precision AS total
          FROM households h
          JOIN client.household_customer_types hct
            ON hct.household_id = h.id
          JOIN client.customer_types ct
            ON ct.id = hct.customer_type_id
          WHERE h.location_id=$1
          GROUP BY ct.id
        `, [location_id])
        add('households', households_values)

        const sql = `
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
        const towers_values = await database.query(`
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
        `, [location_id])
        add('towers', towers_values)

        const locationInfo = await database.findOne(`
          SELECT address,zipcode,city, ST_AsGeojson(geog)::json AS geog,cb.tabblock_id, cb.name
          FROM locations 
          JOIN aro.census_blocks cb ON ST_Contains(cb.geom, locations.geom)
          WHERE locations.id=$1
        `, [location_id])

        const locationSources = {}

        locationSources.hhSourceIds = await database.findOne(`
            SELECT array_agg(object_id) as object_ids FROM households
            WHERE location_id=$1
        `, [location_id])

        locationSources.bizSourceIds = await database.findOne(`
          SELECT array_remove(array_agg(object_id), null) as object_ids FROM businesses
          WHERE location_id=$1
        `, [location_id])

        locationSources.towerSourceIds = await database.findOne(`
          SELECT array_agg(object_id) as object_ids FROM towers
          WHERE location_id=$1
        `, [location_id])

        const result = await database.findOne(`
          SELECT name,attributes FROM location_entity
          WHERE id=$1
        `, [location_id])
        locationInfo.name = result.name ? result.name : ''
        if (!result || !result.attributes) {
          locationInfo.attributes = []
          await Promise.resolve() // There are no attributes for households, celltowers
        } else {
          locationInfo.attributes = []
          let order_property_string = 'business_attribute_order_' + process.env.ARO_CLIENT.toString().toLowerCase()
          let order_property_query = `select spf.name, sp.string_value from client.system_property sp join client.system_rule sr on sp.system_rule_id = sr.id join client.system_property_field spf on sp.property_field_id = spf.id where spf.name = \'${order_property_string}\'`
          const order = await database.findOne(order_property_query)
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
        }

        locationInfo.locSourceIds = locationSources
        return Object.assign(info, locationInfo)
  }

  // FIXME: legacy code, transfer to service
  static exportAsCSV(polygon, planId) {
    if(polygon.length === 0)
        return ""

    return Promise.resolve()
    .then(()=>{
      var polyJSON = JSON.stringify({"type":"Polygon","coordinates": [polygon] })
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
            ws.name AS "Location Status",  
            ST_Y(l.geom) || ' ' || ST_X(l.geom) AS "Lat Long Concat",
            s.name AS "Wirecenter Name",
            s.code AS "Wirecenter CLLI",
            '="' || c.tabblock_id || '"' AS "Census Block",
            (SELECT description FROM aro_core.tag WHERE id = ((c.tags->'category_map'->>(SELECT id FROM aro_core.category WHERE description = 'CAF Phase I Part I')::text)::int)) AS "CAF Phase I Part I Tag",
            (SELECT description FROM aro_core.tag WHERE id = ((c.tags->'category_map'->>(SELECT id FROM aro_core.category WHERE description = 'CAF Phase I Part II')::text)::int)) AS "CAF Phase I Part II Tag",
            (SELECT description FROM aro_core.tag WHERE id = ((c.tags->'category_map'->>(SELECT id FROM aro_core.category WHERE description = 'CAF Phase II')::text)::int)) AS "CAF Phase II Tag"
            FROM inputs i
            JOIN client.active_plan_data_source apds ON apds.root_plan_id = i.root_plan_id AND data_type_id=1
            JOIN aro.location_entity l ON ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON(i.geojson),4326), l.geom) AND l.date_to = '294276-01-01 00:00:00'::date
              AND l.data_source_id = ANY(apds.full_path)
            LEFT JOIN client.service_area s ON ST_Intersects(s.geom,ST_SetSRID(ST_GeomFromGeoJSON(i.geojson),4326)) AND ST_Contains(s.geom,l.geom) AND s.service_layer_id = 1
            JOIN aro_core.global_library g ON g.data_source_id = l.data_source_id
            JOIN aro.census_blocks c ON l.cb_gid = c.gid
            JOIN aro.workflow_state ws ON l.workflow_state_id = ws.id
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

  // FIXME: legacy code, transfer to service
  static getLocationIds(sql) {
    return database.findValues(sql,null,'id')
  }
}
