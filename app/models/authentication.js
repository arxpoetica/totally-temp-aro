'use strict'

var helpers = require('../helpers')
var database = helpers.database

class Authentication {

  static getConfig(authName) {
    const sql = `
      SELECT ea.config
      FROM auth.external_auth ea
      JOIN auth.external_auth_type eat
      ON ea.auth_type_id = eat.id
      WHERE eat.name = $1;
    `
    return database.query(sql, [authName])
      .then((result) => Promise.resolve(result[0].config))
  }
}

module.exports = Authentication
