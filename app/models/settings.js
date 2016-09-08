// Settings
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var pync = require('pync')

module.exports = class Settings {

  static view () {
    return Promise.all([
      database.query(`
        SELECT ca.id, cc.description AS name, uom.description AS unit, ca.cost AS cost
          FROM financial.cost_assignment ca
          JOIN financial.cost_code cc ON ca.cost_code_id = cc.id
          JOIN aro.uom uom ON cc.unit_of_measure_id = uom.id
          ORDER BY uom.description, cc.description ASC
      `),
      database.query(`
        SELECT
          rci.id,
          arpu,
          entity_growth,
          churn_rate,
          opex_percent,
          maintenance_expenses,
          connection_cost,
          ec.description AS entity_description,
          st.description AS product
        FROM financial.roic_component_input rci
        JOIN client.speed_type st ON rci.speed_type_id = st.id
        JOIN client.entity_category ec ON rci.entity_category_id = ec.id
      `),
      database.query(`
        SELECT
          service_layer_priority.id, default_priority,
          service_layer.description AS service_layer_description
        FROM client.service_layer_priority
        JOIN client.service_layer ON service_layer.id = service_layer_priority.service_layer_id
      `),
      database.query(`
        SELECT
          service_layer_entity_category.id, entity_category.description AS entity_description,
          service_layer.description AS service_layer_description,
          service_layer.id AS service_layer_id
        FROM client.service_layer_entity_category
        JOIN client.service_layer ON service_layer.id = service_layer_entity_category.service_layer_id
        JOIN client.entity_category ON entity_category.id = service_layer_entity_category.entity_category_id
        ORDER BY id ASC
      `)
    ])
    .then((results) => ({
      networkCosts: results[0],
      financialAssumptions: results[1],
      serviceLayerPriorities: results[2],
      serviceLayerEntityCategories: results[3]
    }))
  }

  static update (options) {
    var networkCosts = options.networkCosts || {}
    var financialAssumptions = options.financialAssumptions || {}
    var serviceLayerPriorities = options.serviceLayerPriorities || {}
    var serviceLayerEntityCategories = options.serviceLayerEntityCategories || {}
    var financialFields = [
      'arpu',
      'entity_growth',
      'churn_rate',
      'opex_percent',
      'maintenance_expenses',
      'connection_cost'
    ]
    return Promise.all([
      pync.series(Object.keys(networkCosts), (key) => (
        database.execute(`
          UPDATE financial.cost_assignment
          SET cost=$1 WHERE id=$2
        `, [networkCosts[key].cost, key])
      )),
      pync.series(Object.keys(financialAssumptions), (key) => (
        pync.series(financialFields, (field) => (
          financialAssumptions[key][field] != null &&
          database.execute(`
            UPDATE financial.roic_component_input
            SET ${field}=$1 WHERE id=$2
          `, [financialAssumptions[key][field], key])
        ))
      )),
      pync.series(Object.keys(serviceLayerPriorities), (key) => (
        database.execute(`
          UPDATE client.service_layer_priority
          SET default_priority=$1 WHERE id=$2
        `, [serviceLayerPriorities[key].default_priority, key])
      )),
      pync.series(Object.keys(serviceLayerEntityCategories), (key) => (
        database.execute(`
          UPDATE client.service_layer_entity_category
          SET service_layer_id=$1 WHERE id=$2
        `, [serviceLayerEntityCategories[key].service_layer_id, key])
      ))
    ])
  }

}
