'use strict'

var pg = require('pg')
var _ = require('underscore')
var config = require('./config')

module.exports = class Database {

  static _con_string () {
    return process.env.DATABASE_URL || config.database_url
  }

  static _processQuery (sql, params) {
    var replacements = []
    for (var i = 0, n = 0; i < params.length; i++) {
      var value = params[i]
      if (_.isArray(value)) {
        var placeholders = value.map((val) => {
          return '$x' + (++n)
        }).join(',')
        replacements.push(['\\$' + (i + 1), placeholders])
      } else {
        replacements.push(['\\$' + (i + 1), '$x' + (n + 1)])
        n++
      }
    };
    replacements.forEach((arr) => {
      sql = sql.replace(new RegExp(arr[0], 'g'), arr[1])
    })
    sql = sql.replace(/\$x/g, '\$')
    var flatten = _.flatten(params)
    Array.prototype.splice.apply(params, [0, params.length].concat(flatten))
    return sql
  }

  static _raw (sql, params) {
    params = params || []
    return new Promise((resolve, reject) => {
      pg.connect(this._con_string(), (err, client, done) => {
        if (err) return reject(err)
        sql = this._processQuery(sql, params)
        client.query(sql, params, (err, result) => {
          if (err) console.log('sql failed', sql, params, err.message)
          done()
          err ? reject(err) : resolve(result)
        })
      })
    })
  }

  static query (sql, params) {
    return this._raw(sql, params)
      .then((result) => result.rows)
  }

  static execute (sql, params) {
    return this._raw(sql, params)
      .then((result) => result.rowCount)
  }

  static findOne (sql, params, def) {
    params = params || []
    return this.query(sql, params)
      .then((rows) => rows[0] || def)
  }

  static findValue (sql, params, field, def) {
    return this.query(sql, params)
      .then((rows) => (rows[0] && rows[0][field]) || def)
  }

  static findValues (sql, params, field) {
    return this.query(sql, params)
      .then((rows) => rows.map((row) => row[field]))
  }

}
