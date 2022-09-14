// Network plan
//
// The Route Optimizer finds shortest paths between sources and targets

'use strict'

var helpers = require('../helpers')
var database = helpers.database
var models = require('./')
var _ = require('underscore')
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

  // FIXME: legacy code, transfer to service
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

  // FIXME: legacy code, transfer to service
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

  // FIXME: legacy code, transfer to service
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

  // FIXME: legacy code, transfer to service
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

  // FIXME: legacy code, transfer to service
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

  // FIXME: legacy code, transfer to service
  static _callService (req) {
    return models.AROService.request(req)
  }

}
