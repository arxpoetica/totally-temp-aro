'use strict'

var helpers = require('../helpers')
var database = helpers.database
var pify = require('pify')
var stringify = pify(require('csv-stringify'))

module.exports = class UiEtlTemplate {
  static getEtlTemplatesByType () {
    const sql = 'SELECT name, template FROM ui.etl_template'
    return database.query(sql)
  }
}
