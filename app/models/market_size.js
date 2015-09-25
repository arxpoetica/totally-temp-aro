// MarketSize
//

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');
var stringify = require('csv-stringify');
var _ = require('underscore');

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

function empty_array(arr) {
  return !_.isArray(arr) || arr.length === 0;
}

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
    if (!empty_array(filters.industry)) {
      params.push(filters.industry);
      sql += ' AND spend.industry_id IN ($'+params.length+')';
    }
    if (!empty_array(filters.product)) {
      params.push(filters.product);
      sql += ' AND spend.product_id IN ($'+params.length+')';
    }
    if (!empty_array(filters.employees_range)) {
      params.push(filters.employees_range);
      sql += ' AND spend.employees_by_location_id IN ($'+params.length+')';
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

MarketSize.export_businesses = function(plan_id, type, options, user, callback) {
  var filters = options.filters;
  txain(function(callback) {
    var sql = 'SELECT ST_AsText(ST_Union(edge.geom)::geography) AS route FROM custom.route_edges JOIN client_schema.graph edge ON edge.id = route_edges.edge_id WHERE route_edges.route_id=$1';
    database.findValue(sql, [plan_id], 'route', callback);
  })
  .then(function(route, callback) {
    var params = [];
    var sql = multiline(function() {;/*
      SELECT
        b.id,
        b.name,
        b.address,
        -- MAX(c_industries.industry_name) AS industry_name,
        MAX(industries.description) AS industry_description,
        MAX(e.value_range) AS number_of_employees,
        MAX(ct.name) AS type,
        SUM(spend.monthly_spend * 12)::float as total,
        spend.year
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

    if (!empty_array(filters.industry)) {
      params.push(filters.industry);
      sql += ' AND spend.industry_id IN ($'+params.length+')';
    }
    if (!empty_array(filters.product)) {
      params.push(filters.product);
      sql += ' AND spend.product_id IN ($'+params.length+')';
    }
    if (!empty_array(filters.employees_range)) {
      params.push(filters.employees_range);
      sql += ' AND spend.employees_by_location_id IN ($'+params.length+')';
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
    sql += '\n GROUP BY b.id, year';
    database.query(sql, params, callback);
  })
  .then(function(rows, callback) {
    var businesses = {};
    rows.forEach(function(business) {
      var id = business.id;
      business[business.year] = business.total;
      delete business.total;
      businesses[id] = _.extend(businesses[id] || {}, business);
    });
    var year = String(new Date().getFullYear());
    businesses = _.values(businesses);
    var total = businesses.reduce(function(total, business) {
      return total + (business[year] || 0);
    }, 0);
    this.set('total', total);
    console.log('Market size total for current year:', total);
    stringify(businesses, callback);
  })
  .then(function(csv, callback) {
    var header = ['Name', 'Address', 'Industry name', 'Number of employees', 'Type', 'Total spend'];
    csv = header.join(',')+'\n'+csv;
    this.set('csv', csv);

    if (empty_array(filters.product)) return callback(null, []);
    var sql = 'SELECT product_type, product_name FROM client.products WHERE id IN($1)';
    database.query(sql, [filters.product], callback);
  })
  .then(function(products, callback) {
    this.set('products', products);

    if (empty_array(filters.employees_range)) return callback(null, []);
    var sql = 'SELECT value_range FROM client.employees_by_location WHERE id IN($1)';
    database.query(sql, [filters.employees_range], callback);
  })
  .then(function(employees_by_location, callback) {
    this.set('employees_by_location', employees_by_location);
    
    if (empty_array(filters.industries)) return callback(null, []);
    var sql = 'SELECT industry_name FROM client.industries WHERE id IN($1)';
    database.query(sql, [filters.industries], callback);
  })
  .then(function(industries, callback) {
    this.set('industries', industries);
    
    var sql = 'SELECT name, area_name FROM custom.route WHERE id=$1';
    database.findOne(sql, [plan_id], callback);
  })
  .then(function(plan, callback) {
    var footer = [[]];
    footer.push(['Export Attributes']);
    if (user) {
      footer.push(['Created by:', user.last_name+' '+user.first_name]);
    }
    footer.push(['Created on:', new Date().toISOString()]) // TODO date format
    footer.push([]);
    footer.push(['User-specified Inputs']);
    footer.push(['Network plan:', plan.name]);
    footer.push(['Geography:', plan.area_name]);
    footer.push([]);
    var industries = this.get('industries');
    if (industries.length > 0) {
      footer.push(['Industries Included In Market Sizing']);
      industries.forEach(function(industry) {
        footer.push(['', industry.industry_name]);
      });
      footer.push([]);
    }
    var products = this.get('products');
    if (products.length > 0) {
      footer.push(['Products Included In Market Sizing']);
      products.forEach(function(product) {
        footer.push(['', product.product_type, product.product_name]);
      });
      footer.push([]);
    }
    var employees_by_location = this.get('employees_by_location');
    if (employees_by_location.length > 0) {
      footer.push(['Employee Ranges Included In Market Sizing']);
      employees_by_location.forEach(function(range) {
        footer.push(['', range.value_range]);
      });
      footer.push([]);
    }
    stringify(footer, callback);
  })
  .then(function(footer, callback) {
    var csv = this.get('csv') + footer;
    callback(null, csv, this.get('total'));
  })
  .end(callback);
};

module.exports = MarketSize;
