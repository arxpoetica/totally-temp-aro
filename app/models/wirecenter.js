// Wirecenter
//
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var _ = require('underscore')

module.exports = class Wirecenter {

  static findServiceAreas (viewport, type) {
    var geom = viewport ? 'geom' : 'ST_AsGeoJSON(geom)::json AS geom'
    var sql = `
      SELECT service_area.id, ${geom}, code AS name, ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid
        FROM client.service_area
        JOIN client.service_layer
          ON service_area.service_layer_id = service_layer.id
        AND service_layer.name=$1
        ${database.intersects(viewport, 'geom', 'WHERE')}
    `
    return viewport
      ? database.polygons(sql, [type], true, viewport)
      : database.query(sql, [type], true)
  }

  static findAnalysisAreas (viewport, type) {
    var sql = `
      SELECT analysis_area.id, geom, code AS name, ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid
        FROM client.analysis_area
        JOIN client.analysis_layer
          ON analysis_area.analysis_layer_id = analysis_layer.id
        AND analysis_layer.name=$1
        ${database.intersects(viewport, 'geom', 'WHERE')}
    `
    return database.polygons(sql, [type], true, viewport)
  }

  static addServiceAreaTargets (plan_id, service_area_ids) {
    if (!_.isArray(service_area_ids) || service_area_ids.length === 0) return Promise.resolve()

    var sql = `
      INSERT INTO client.selected_service_area(service_area_id, plan_id)
      (
        SELECT id, $2
        FROM client.service_area
        WHERE id IN ($1)
        AND id NOT IN (SELECT service_area_id FROM client.selected_service_area WHERE plan_id=$2)  -- We don't want duplicate servicearea targets
      )
    `
    return database.query(sql, [service_area_ids, plan_id])
  }

  static removeServiceAreaTargets (plan_id, service_area_ids) {
    if (!_.isArray(service_area_ids) || service_area_ids.length === 0) return Promise.resolve()

    var sql = `
      DELETE FROM client.selected_service_area
      WHERE service_area_id in ($1)
      AND plan_id = $2
    `
    return database.query(sql, [service_area_ids, plan_id])
  }

  static removeAllServiceAreaTargets (plan_id) {
    var sql = 'DELETE FROM client.selected_service_area WHERE plan_id=$1'    
    return database.query(sql, [plan_id])
  }

  /*
   * Returns a list of SA IDs that are selected for this plan and the given viewport
   */
  static selectedServiceAreaIds(planId) {
    var sql = `
      SELECT service_area_id
      FROM client.selected_service_area
      WHERE plan_id=$1
    `
    return database.query(sql, [planId])
  }

  static addAnalysisAreaTargets (plan_id, analysis_area_ids) {
    if (!_.isArray(analysis_area_ids) || analysis_area_ids.length === 0) return Promise.resolve()

    var sql = `
      INSERT INTO client.selected_analysis_area(analysis_area_id, plan_id)
      (
        SELECT id, $2
        FROM client.analysis_area
        WHERE id IN ($1)
        AND id NOT IN (SELECT analysis_area_id FROM client.selected_analysis_area WHERE plan_id=$2)  -- We don't want duplicate analysis area targets
      )
    `
    return database.query(sql, [analysis_area_ids, plan_id])
  }

  static removeAnalysisAreaTargets (plan_id, analysis_area_ids) {
    if (!_.isArray(analysis_area_ids) || analysis_area_ids.length === 0) return Promise.resolve()

    var sql = `
      DELETE FROM client.selected_analysis_area
      WHERE analysis_area_id in ($1)
      AND plan_id = $2
    `
    return database.query(sql, [analysis_area_ids, plan_id])
  }

  static removeAllAnalysisAreaTargets (plan_id) {
    var sql = 'DELETE FROM client.selected_analysis_area WHERE plan_id=$1'    
    return database.query(sql, [plan_id])
  }

  /*
   * Returns a list of Analysis area IDs that are selected for this plan and the given viewport
   */
  static selectedAnalysisAreaIds(planId) {
    var sql = `
      SELECT analysis_area_id
      FROM client.selected_analysis_area
      WHERE plan_id=$1
    `
    return database.query(sql, [planId])
  }
}
