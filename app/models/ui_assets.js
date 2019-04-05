'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class UiAssets {

  static getAssetByKey (assetKey) {
    const sql = 'SELECT data::bytea FROM ui.assets WHERE key=$1'
    return database.query(sql, [assetKey])
      .then(res => {
        return Promise.resolve(res[0].data)
      })
  }

  static saveAsset (assetKey, data) {
    const sql = 'INSERT INTO ui.assets(key, data) VALUES($1, $2)'
    return database.query(sql, [assetKey, data])
  }
}
