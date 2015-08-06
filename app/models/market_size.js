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

MarketSize.calculate = function(geo_json, threshold, filters, callback) {
  threshold = +threshold || 0;
  var def = { total: 10 };
  var params = [];
  var sql = multiline(function() {;/*
    SELECT
      spend.year, SUM(spend.monthly_spend * 12)::numeric as total
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
      AND ((regexp_split_to_array(e.value_range, '\D+'))[1]::integer <= b.number_of_employees)
      AND (((regexp_split_to_array(e.value_range, '\D+'))[2] || '9999999999999999999')::numeric >= b.number_of_employees)
    WHERE
      ST_Intersects(ST_Buffer(ST_GeomFromGeoJSON($x1)::geography, $x2), b.geog)
  */});
  params.push(geo_json);
  sql = sql.replace('$x1', '$'+params.length);
  params.push(threshold);
  sql = sql.replace('$x2', '$'+params.length);
  sql += ' GROUP BY spend.year ORDER BY spend.year ASC'
  database.query(sql, params, callback);
}

module.exports = MarketSize;
