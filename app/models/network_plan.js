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
  static getIdsFromSql(sql) {
    return database.findValues(sql, null, 'id')
  }

}
