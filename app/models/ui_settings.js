'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class UiSettings {
  static getSettingsForClient (aroClient) {
    const sql = 'SELECT type, settings FROM ui.settings WHERE client=$1'
    return database.query(sql, [aroClient])
      .then(results => {
        var settingsObj = {}
        results.forEach(item => { settingsObj[item.type] = item.settings })
        return Promise.resolve(settingsObj)
      })
  }

  static saveSettings (aroClient, settingType, settingValue) {
    const sql = `
      INSERT INTO ui.settings(client, type, settings)
      VALUES($1, $2, $3)
      ON CONFLICT ON CONSTRAINT client_type_unique
      DO
        UPDATE
          SET settings=$3;
    `
    return database.query(sql, [aroClient, settingType, settingValue])
  }
}
