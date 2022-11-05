// Settings
import database from '../helpers/database.cjs'
import config from '../helpers/config.cjs'
import AROService from './aro_service.js'
import pync from 'pync'

export default class Settings {

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
      `),
      database.query(`
        SELECT system_rule_id || ':' || property_field_id AS id, name, type, description, string_value FROM client.system_property sp
        JOIN client.system_property_field spf ON  spf.id = sp.property_field_id
        ORDER BY description ASC
      `),
      database.query(`
        SELECT s.dimension_id as dimension_id, product_type, product_name, arpu_weight FROM client.spend_matrix_selection s
        JOIN client.products p ON s.dimension_id = p.id
        WHERE dimension_type = 'product'
        ORDER BY product_type
      `)
    ])
    .then((results) => ({
      networkCosts: results[0],
      financialAssumptions: results[1],
      serviceLayerPriorities: results[2],
      serviceLayerEntityCategories: results[3],
      systemProperties: results[4],
      businessProducts: results[5]
    }))
  }

  static update (options) {
    var networkCosts = options.networkCosts || {}
    var financialAssumptions = options.financialAssumptions || {}
    var serviceLayerPriorities = options.serviceLayerPriorities || {}
    var serviceLayerEntityCategories = options.serviceLayerEntityCategories || {}
    var systemProperties = options.systemProperties || {}
    var businessProducts = options.businessProducts || {}
    var financialFields = [
      'arpu',
      'entity_growth',
      'churn_rate',
      'opex_percent',
      'maintenance_expenses',
      'connection_cost'
    ]
    var businessProductsFields = [
      'arpu_weight'
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
      )),
      pync.series(Object.keys(systemProperties), (key) => (
        database.execute(`
          UPDATE client.system_property
          SET string_value=$1 WHERE (system_rule_id || ':' || property_field_id) =$2
        `, [systemProperties[key].string_value, key])
      )),
      pync.series(Object.keys(businessProducts), (key) => (	  
    	pync.series(businessProductsFields, (field) => (
    	  businessProducts[key][field] != null &&
    	  database.execute(`
    	    UPDATE client.spend_matrix_selection
    	    SET ${field}=$1 WHERE dimension_id=$2 and dimension_type=$3
    	   `, [businessProducts[key][field], key, 'product'])
    	))
      ))
    ])
    .then(() => {
      var invalidation = []
      if (Object.keys(networkCosts).length > 0) {
        invalidation.push('PRICE_INPUTS')
      }
      if (Object.keys(systemProperties).length > 0) {
        invalidation.push('SYSTEM_PROPERTIES')
      }
      if (Object.keys(serviceLayerPriorities).length > 0) {
        invalidation.push('SERVICE_LAYER_INPUTS')
      }
      if (Object.keys(serviceLayerEntityCategories).length > 0) {
        invalidation.push('SERVICE_LAYER_INPUTS')
      }
      if (Object.keys(financialAssumptions).length > 0) {
        invalidation.push('ROIC_ENGINE_INPUTS')
        invalidation.push('ROIC_SERVICE_INPUTS')
      }
      return pync.series(invalidation, (key) => (
        AROService.request({
          url: config.aro_service_url + `/ref-cache/${key}`,
          method: 'DELETE',
          json: true
        })
      ))
    })
  }

  static queryAroCache () {
    /*
        [ { type: 'ROIC_ENGINE_INPUTS',
        info: { lastTouchedInMillis: 300000, valuePresent: false } },
      { type: 'ROIC_SERVICE_INPUTS',
        info: { lastTouchedInMillis: 300000, valuePresent: false } },
      { type: 'SERVICE_LAYER_INPUTS',
        info: { lastTouchedInMillis: 300000, valuePresent: false } },
      { type: 'PRICE_INPUTS',
        info: { lastTouchedInMillis: 300000, valuePresent: false } },
      { type: 'SYSTEM_PROPERTIES',
        info: { lastTouchedInMillis: 300000, valuePresent: false } } ]
    */
    var req = {
      url: config.aro_service_url + '/ref-cache',
      json: true
    }
    AROService.request(req)
      .then((data) => {
        console.log('data', data)
      })
      .catch((err) => {
        console.log('err', err)
      })
  }

  static refreshDBCache () {
     var sql = 'TRUNCATE cache.cache_entries; ' + 
               'TRUNCATE cache.service_area_versions;'

     return database.execute(sql);
  }

}
