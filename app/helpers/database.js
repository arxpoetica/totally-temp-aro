'use strict'

var pg = require('pg')
var _ = require('underscore')
var config = require('./config')
var geojson = require('./geojson')

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

  static query (sql, params, asFeatureCollection) {
    return this._raw(sql, params)
      .then((result) => asFeatureCollection
        ? geojson.featureCollection(result.rows) : result.rows)
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

  static points (sql, params, asFeatureCollection, viewport) {
    var finalSql
    if (viewport.zoom > viewport.threshold) {
      finalSql = `
        WITH features AS (${sql})
        SELECT
          features.*,
          ST_AsGeoJSON(geom)::json AS geom
        FROM features
        WHERE ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($${params.length + 1})), 4326), features.geom)
      `
      params.push(viewport.linestring)
    } else {
      finalSql = `
        WITH features AS (${sql})
        SELECT
          -- COUNT(*) AS density,
          ST_AsGeoJSON(ST_ConvexHull(ST_Collect( geom )))::json AS geom
          -- ST_AsText( ST_Centroid(ST_Collect( geom )) ) AS centroid
        FROM features
        WHERE ST_Contains(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($${params.length + 1})), 4326), features.geom)
        GROUP BY ST_SnapToGrid(geom, $${params.length + 2})
      `
      params.push(viewport.linestring)
      params.push(viewport.buffer * 3)
    }
    return this.query(finalSql, params, asFeatureCollection)
  }

  static polygons (sql, params, asFeatureCollection, viewport) {
    var finalSql
    if (viewport.zoom > viewport.threshold) {
      finalSql = `
        WITH features AS (${sql})
        SELECT
          features.*,
          ST_AsGeoJSON(geom)::json AS geom
        FROM features
        WHERE ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($${params.length + 1})), 4326), features.geom)
      `
      params.push(viewport.linestring)
    } else {
      finalSql = `
        WITH features AS (${sql})
        SELECT
          ST_AsGeoJSON(ST_Simplify(ST_Union(geom), $${params.length + 1}, true))::json AS geom
        FROM features
        WHERE ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($${params.length + 2})), 4326), features.geom)
      `
      params.push(viewport.simplify_factor)
      params.push(viewport.linestring)
    }
    return this.query(finalSql, params, asFeatureCollection)
  }

  static lines (sql, params, asFeatureCollection, viewport) {
    var finalSql
    if (viewport.zoom > viewport.threshold) {
      finalSql = `
        WITH features AS (${sql})
        SELECT
          features.*,
          ST_AsGeoJSON(geom)::json AS geom
        FROM features
        WHERE ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($${params.length + 1})), 4326), features.geom)
      `
      params.push(viewport.linestring)
    } else {
      finalSql = `
        WITH features AS (${sql})
        SELECT
          COUNT(*) AS _density,
          ST_AsGeoJSON(ST_Envelope( ST_SnapToGrid(geom, $${params.length + 2}) ))::json AS geom
        FROM features
        WHERE ST_Contains(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($${params.length + 1})), 4326), features.geom)
        GROUP BY ST_SnapToGrid(geom, $${params.length + 2})
      `
      params.push(viewport.linestring)
      params.push(viewport.buffer * 3)
    }
    return this.query(finalSql, params, asFeatureCollection)
  }

  static density (sql, params, asFeatureCollection, viewport, density) {
    var finalSql = `
      WITH features AS (${sql})
      SELECT
        ${density || 'COUNT(*)'} AS _density,
        ST_AsGeoJSON(ST_Envelope( ST_SnapToGrid(geom, $${params.length + 2}) ))::json AS geom
      FROM features
      WHERE ST_Contains(ST_SetSRID(ST_MakePolygon(ST_GeomFromText($${params.length + 1})), 4326), features.geom)
      GROUP BY ST_SnapToGrid(geom, $${params.length + 2})
    `
    params.push(viewport.linestring)
    params.push(viewport.buffer * 3)
    return this.query(finalSql, params, asFeatureCollection)
  }
}

module.exports.query('SELECT * from aro.algorithms')
  .then((result) => {
    Array.prototype.splice.apply(config.route_planning,
      [0, config.route_planning.length].concat(result))
  })
  .catch((err) => console.error(err.stack))
