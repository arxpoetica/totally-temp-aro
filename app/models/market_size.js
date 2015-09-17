// MarketSize
//

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');

var MarketSize = {};

// Get available filters
MarketSize.filters = function(callback) {
  var output = {};
  txain(function(callback) {
    var sql = 'SELECT * FROM client.products';
    database.query(sql, callback);
  })
  .then(function(rows, callback) {
    output.products = rows;

    var sql = 'SELECT * FROM client.industries';
    database.query(sql, callback);
  })
  .then(function(rows, callback) {
    output.industries = rows;
    
    var sql = 'SELECT * FROM client.employees_by_location';
    database.query(sql, callback);
  })
  .then(function(rows, callback) {
    output.employees_by_location = rows;
    
    callback(null, output);
  })
  .end(callback);
};

MarketSize.calculate = function(route_id, type, options, callback) {
  var filters = options.filters;
  var params = [];
  var sql = multiline(function() {;/*
    SELECT
      spend.year, SUM(spend.monthly_spend * 12)::float as total
    FROM
      businesses b
    JOIN
      client.industry_mapping m
    ON
      m.sic4 = b.industry_id
    JOIN
      client.spend
    ON
      spend.industry_id = m.industry_id
      AND spend.monthly_spend <> 'NaN'
  */});
  if (filters.industry) {
    params.push(filters.industry)
    sql += ' AND spend.industry_id = $'+params.length
  }
  if (filters.product) {
    params.push(filters.product)
    sql += ' AND spend.product_id = $'+params.length
  }
  if (filters.employees_range) {
    params.push(filters.employees_range)
    sql += ' AND spend.employees_by_location_id = $'+params.length
  }
  sql += multiline(function() {;/*
    JOIN
      client.employees_by_location e
    ON
      e.id = spend.employees_by_location_id
      AND e.min_value <= b.number_of_employees
      AND e.max_value >= b.number_of_employees
    WHERE
  */});
  // 152.4 meters = 500 feet
  if (type === 'boundary') {
    params.push(options.boundary);
    sql += '\n ST_Intersects(ST_GeomFromGeoJSON($'+params.length+')::geography, b.geog)'
  } else if (type === 'route') {
    params.push(route_id);
    sql += '\n ST_DWithin((SELECT ST_Union(edge.geom)::geography FROM custom.route_edges JOIN client.graph edge ON edge.id = route_edges.edge_id WHERE route_edges.route_id=$'+params.length+'), b.geog, 152.4)';
  } else if (type === 'addressable') {
    params.push(route_id);
    sql += '\n ST_DWithin((SELECT ST_Union(edge.geom)::geography FROM custom.route_edges JOIN client.graph edge ON edge.id = route_edges.edge_id WHERE route_edges.route_id=$'+params.length+'), b.geog, 152.4)';
    sql += ' AND ';
    params.push(options.boundary);
    sql += '\n ST_Intersects(ST_GeomFromGeoJSON($'+params.length+')::geography, b.geog)'
  }
  sql += '\n GROUP BY spend.year ORDER BY spend.year ASC';
  database.query(sql, params, callback);
};

module.exports = MarketSize;
