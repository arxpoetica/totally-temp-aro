'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class UiSettings {
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
