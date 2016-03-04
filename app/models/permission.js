// Permission

'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class Permission {

  static grant_access (plan_id, user_id, rol) {
    return Promise.resolve()
      .then(() => (
        database.execute('DELETE FROM auth.permissions WHERE plan_id=$1 AND user_id=$2',
          [plan_id, user_id])
      ))
      .then(() => (
        database.execute('DELETE FROM auth.permissions WHERE plan_id=$1 AND user_id=$2',
          [plan_id, user_id])
      ))
      .then(() => (
        database.execute('INSERT INTO auth.permissions (plan_id, user_id, rol) VALUES ($1, $2, $3)',
          [plan_id, user_id, rol])
      ))
  }

  static revoke_access (plan_id, user_id) {
    return database.execute('DELETE FROM auth.permissions WHERE plan_id=$1 AND user_id=$2',
      [plan_id, user_id])
  }

  static find_permission (plan_id, user_id) {
    return database.findOne('SELECT rol FROM auth.permissions WHERE plan_id=$1 AND user_id=$2',
      [plan_id, user_id])
  }

}
