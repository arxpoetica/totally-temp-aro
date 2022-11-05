import database from '../helpers/database.cjs'

export default class UiSettings {
  static getSettingsForClient (aroClient) {
    const sql = 'SELECT type, settings FROM ui.settings WHERE client=$1'
    return database.query(sql, [aroClient])
      .then(results => {
        var settingsObj = {}
        results.forEach(item => { settingsObj[item.type] = item.settings })
        return Promise.resolve(settingsObj)
      })
  }

  static getStylesheetsForClient (aroClient) {
    const sql = 'SELECT settings FROM ui.stylesheets WHERE client=$1'
    return database.findOne(sql, [aroClient])
      .then(results => {
        return Promise.resolve(results && results.settings)
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

  static savestylesheet (aroClient, stylesheetsValue) {
    const sql = `
      INSERT INTO ui.stylesheets(client, settings)
      VALUES($1, $2)
      ON CONFLICT ON CONSTRAINT client_unique
      DO
        UPDATE
          SET settings=$2;
    `
    return database.query(sql, [aroClient, stylesheetsValue])
  }

  static getAllRfpTemplates () {
    const sql = 'SELECT * FROM ui.rfp_template;'
    return database.query(sql)
  }

  static createRfpTemplate ({ templateName, template, rfpVersion }) {
    const sql = `
      INSERT INTO ui.rfp_template(name, value, service_request_schema_id, version)
      VALUES(
        $1,
        $2,
        (SELECT id FROM ui.service_request_schema WHERE name='/rfp/process'),
        $3
      );
    `
    return database.query(sql, [templateName, template, rfpVersion])
  }

  static deleteRfpTemplate (id) {
    const sql = 'DELETE FROM ui.rfp_template WHERE id = $1'
    return database.query(sql, [id])
  }
}
