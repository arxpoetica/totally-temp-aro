import database from '../helpers/database.cjs'

export default class UiAssets {
  static getAssetKeys (offset = 0, limit = 10) {
    limit = Math.min(limit, 1000)
    const sql = 'SELECT key FROM ui.assets OFFSET $1 LIMIT $2'
    return database.query(sql, [offset, limit])
      .then(res => res.map(item => item.key))
  }

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
