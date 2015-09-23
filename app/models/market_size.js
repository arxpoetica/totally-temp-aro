// MarketSize
//

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');
var stringify = require('csv-stringify');

var MarketSize = {};

// Get available filters
MarketSize.filters = function(callback) {
  var output = {};
  txain(function(callback) {
    var sql = 'SELECT * FROM client_schema.products';
    database.query(sql, callback);
  })
  .then(function(rows, callback) {
    output.products = rows;

    var sql = 'SELECT * FROM client_schema.industries';
    database.query(sql, callback);
  })
  .then(function(rows, callback) {
    output.industries = rows;
    
    var sql = 'SELECT * FROM client_schema.employees_by_location';
    database.query(sql, callback);
  })
  .then(function(rows, callback) {
    output.employees_by_location = rows;
    
    callback(null, output);
  })
  .end(callback);
};

MarketSize.calculate = function(plan_id, type, options, callback) {
  txain(function(callback) {
    var sql = 'SELECT ST_AsText(ST_Union(edge.geom)::geography) AS route FROM custom.route_edges JOIN client_schema.graph edge ON edge.id = route_edges.edge_id WHERE route_edges.route_id=$1';
    database.findValue(sql, [plan_id], 'route', callback);
  })
  .then(function(route, callback) {
    var filters = options.filters;
    var params = [];
    var sql = multiline(function() {;/*
      SELECT
        spend.year, SUM(spend.monthly_spend * 12)::float as total
      FROM
        businesses b
      JOIN
        client_schema.industry_mapping m
      ON
        m.sic4 = b.industry_id
      JOIN
        client_schema.spend
      ON
        spend.industry_id = m.industry_id
        AND spend.monthly_spend <> 'NaN'
    */});
    if (filters.industry) {
      params.push(filters.industry);
      sql += ' AND spend.industry_id = $'+params.length;
    }
    if (filters.product) {
      params.push(filters.product);
      sql += ' AND spend.product_id = $'+params.length;
    }
    if (filters.employees_range) {
      params.push(filters.employees_range);
      sql += ' AND spend.employees_by_location_id = $'+params.length;
    }
    sql += multiline(function() {;/*
      JOIN
        client_schema.employees_by_location e
      ON
        e.id = spend.employees_by_location_id
        AND e.min_value <= b.number_of_employees
        AND e.max_value >= b.number_of_employees
      WHERE
    */});
    // 152.4 meters = 500 feet
    if (type === 'boundary') {
      params.push(options.boundary);
      sql += '\n ST_Intersects(ST_GeomFromGeoJSON($'+params.length+')::geography, b.geog)';
    } else if (type === 'route') {
      params.push(route);
      sql += '\n ST_DWithin(ST_GeogFromText($'+params.length+'), b.geog, 152.4)';
    } else if (type === 'addressable') {
      params.push(route);
      sql += '\n ST_DWithin(ST_GeogFromText($'+params.length+'), b.geog, 152.4)';
      sql += ' AND ';
      params.push(options.boundary);
      sql += '\n ST_Intersects(ST_GeomFromGeoJSON($'+params.length+')::geography, b.geog)';
    }
    sql += '\n GROUP BY spend.year ORDER BY spend.year ASC';
    database.query(sql, params, callback);
  })
  .end(callback);
};

MarketSize.export_businesses = function(plan_id, type, options, callback) {
  txain(function(callback) {
    var sql = 'SELECT ST_AsText(ST_Union(edge.geom)::geography) AS route FROM custom.route_edges JOIN client_schema.graph edge ON edge.id = route_edges.edge_id WHERE route_edges.route_id=$1';
    database.findValue(sql, [plan_id], 'route', callback);
  })
  .then(function(route, callback) {
    var filters = options.filters;
    var params = [];
    var sql = multiline(function() {;/*
      SELECT
        b.name,
        b.address,
        MAX(industries.description) AS industry_description,
        b.number_of_employees,
        MAX(ct.name) AS type,
        SUM(spend.monthly_spend * 12)::float as total
      FROM
        businesses b
      JOIN
        industries
      ON
        industries.id = b.industry_id
      JOIN
        client_schema.business_customer_types bct
      ON
        bct.business_id = b.id
      JOIN
        client_schema.customer_types ct
      ON
        ct.id=bct.customer_type_id
      JOIN
        client_schema.industry_mapping m
      ON
        m.sic4 = b.industry_id
      JOIN
        client_schema.spend
      ON
        spend.industry_id = m.industry_id
        AND spend.monthly_spend <> 'NaN'
    */});
    params.push(new Date().getFullYear());
    sql += ' AND spend.year = $'+params.length;

    if (filters.industry) {
      params.push(filters.industry);
      sql += ' AND spend.industry_id = $'+params.length;
    }
    if (filters.product) {
      params.push(filters.product);
      sql += ' AND spend.product_id = $'+params.length;
    }
    if (filters.employees_range) {
      params.push(filters.employees_range);
      sql += ' AND spend.employees_by_location_id = $'+params.length;
    }
    sql += multiline(function() {;/*
      JOIN
        client_schema.employees_by_location e
      ON
        e.id = spend.employees_by_location_id
        AND e.min_value <= b.number_of_employees
        AND e.max_value >= b.number_of_employees
      WHERE
    */});
    // 152.4 meters = 500 feet
    if (type === 'boundary') {
      params.push(options.boundary);
      sql += '\n ST_Intersects(ST_GeomFromGeoJSON($'+params.length+')::geography, b.geog)';
    } else if (type === 'route') {
      params.push(route);
      sql += '\n ST_DWithin(ST_GeogFromText($'+params.length+'), b.geog, 152.4)';
    } else if (type === 'addressable') {
      params.push(route);
      sql += '\n ST_DWithin(ST_GeogFromText($'+params.length+'), b.geog, 152.4)';
      sql += ' AND ';
      params.push(options.boundary);
      sql += '\n ST_Intersects(ST_GeomFromGeoJSON($'+params.length+')::geography, b.geog)';
    }
    sql += '\n GROUP BY b.id';
    database.query(sql, params, callback);
  })
  .then(function(rows, callback) {
    var total = rows.reduce(function(total, row) {
      return total + row.total;
    }, 0);
    this.set('total', total);
    console.log('Market size total for current year:', total);
    stringify(rows, callback);
  })
  .then(function(csv, callback) {
    callback(null, csv, this.get('total'));
  })
  .end(callback);
};

module.exports = MarketSize;
