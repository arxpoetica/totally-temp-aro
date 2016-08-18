// Settings
'use strict'

var helpers = require('../helpers')
var database = helpers.database
var pync = require('pync')

module.exports = class Settings {

  static view () {
    var sql = `
      SELECT ca.id, cc.description AS name, uom.description AS unit, ca.cost AS cost
        FROM financial.cost_assignment ca
        JOIN financial.cost_code cc ON ca.cost_code_id = cc.id
        JOIN aro.uom uom ON cc.unit_of_measure_id = uom.id
        ORDER BY uom.description, cc.description ASC
    `
    return database.query(sql)
  }

  static update (options) {
    return pync.series(Object.keys(options), (key) => (
      database.execute('UPDATE financial.cost_assignment SET cost=$1 WHERE id=$2', [options[key], key])
    ))
  }

}
