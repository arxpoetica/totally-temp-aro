'use strict'

var pg = require('pg')
var _ = require('underscore')
var config = require('./config.cjs')
var geojson = require('./geojson.cjs')

module.exports = class Database {

  static _conString () {
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
      pg.connect(this._conString(), (err, client, done) => {
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

  static intersects (viewport, column, prefix) {
    if (!viewport) return ''
    return `${prefix} ST_Intersects(ST_SetSRID(ST_MakePolygon(ST_GeomFromText('${viewport.linestring}')), 4326), ${column})`
  }

  static points (sql, params, asFeatureCollection, viewport, noDensity) {
    var finalSql
    var prefix = sql.trim().indexOf('WITH') === 0 ? sql : `WITH features AS (${sql})`
    if (viewport.zoom > viewport.threshold) {
      finalSql = `
        ${prefix}
        SELECT
          features.*,
          ST_AsGeoJSON(geom)::json AS geom
        FROM features
      `
    } else {
      finalSql = `
        ${prefix}
        SELECT
          ${!noDensity ? 'COUNT(*) AS density,' : ''}
          ${
            viewport.heatmap
            ? 'ST_AsGeoJSON(ST_Centroid(ST_Collect(f.geom)))::json AS geom,'
            : 'ST_AsGeoJSON(ST_ConvexHull(ST_Collect(f.geom)))::json AS geom,'
          }
          '{ "path": 0, "scale": 3, "strokeColor": "blue" }'::json AS icon
        FROM features f
        -- INNER JOIN aro.states st ON ST_Intersects(f.geom, st.geom)
        GROUP BY ST_SnapToGrid(f.geom, $${params.length + 1})
      `
      params.push(viewport.buffer * 3)
    }
    return this.query(finalSql, params, asFeatureCollection)
  }
  
  static visiblepoints(sql, params, asFeatureCollection) {
	var finalSql
	var prefix = sql.trim().indexOf('WITH') === 0 ? sql : `WITH features AS (${sql})`
	finalSql = `
	   ${prefix}
	   SELECT
	   features.*,
	   ST_AsGeoJSON(geom)::json AS geom
	   FROM features
	 `
	return this.query(finalSql, params, asFeatureCollection)
  }

  static polygons (sql, params, asFeatureCollection, viewport) {
    var finalSql
    var prefix = sql.trim().indexOf('WITH') === 0 ? sql : `WITH features AS (${sql})`
    if (viewport.zoom > viewport.threshold) {
      finalSql = `
        ${prefix}
        SELECT
          features.*,
          ST_AsGeoJSON(geom)::json AS geom
        FROM features
      `
    } else {
      // 2.1 doesn't support preserveCollapsed
      var preserveCollapsed = postgisversion === '2.1' ? '' : ', true'
      finalSql = `
        WITH features AS (${sql})
        SELECT
          ST_AsGeoJSON(ST_Simplify(ST_Union(geom), $${params.length + 1}::float ${preserveCollapsed}))::json AS geom
        FROM features
      `
      params.push(viewport.simplify_factor)
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
      `
    } else {
      finalSql = `
        WITH features AS (${sql})
        SELECT
          features.*,
          ST_AsGeoJSON(ST_RemoveRepeatedPoints(geom, $${params.length + 1}))::json AS geom
        FROM features
      `
      params.push(viewport.buffer * 100)
    }
    return this.query(finalSql, params, asFeatureCollection)
  }

  static density (sql, params, asFeatureCollection, viewport, density) {
    var finalSql = `
      WITH features AS (${sql})
      SELECT
        ${density || 'COUNT(*)'}::integer AS density,
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

var postgisversion
module.exports.findOne("SELECT split_part(PostGIS_version(), ' ', 1) AS version")
  .then((result) => {
    postgisversion = result.version
  })
  .catch((err) => console.error(err.stack))
