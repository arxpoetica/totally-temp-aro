// MarketSize
//

var helpers = require('../helpers');
var database = helpers.database;
var txain = require('txain');
var multiline = require('multiline');
var stringify = require('csv-stringify');
var _ = require('underscore');
var moment = require('moment');
var config = require('../helpers').config;

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

    var sql = 'SELECT * FROM client_schema.customer_types';
    database.query(sql, callback);
  })
  .then(function(rows, callback) {
    output.customer_types = rows;

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

function prepareMarketSizeQuery(plan_id, type, options, params, output) {
  var sql = '';
  if (type === 'route' || type === 'addressable') {
    if (config.route_planning) {
      sql += 'WITH biz AS (SELECT b.id, b.industry_id, b.number_of_employees, b.location_id, b.name, b.address FROM businesses b JOIN custom.route_edges ON route_edges.route_id=$1 JOIN client_schema.graph edge ON edge.id = route_edges.edge_id AND ST_DWithin(edge.geom::geography, b.geog, 152.4)';
      // sql += 'WITH route AS (SELECT edge.geom AS route FROM custom.route_edges JOIN client_schema.graph edge ON edge.id = route_edges.edge_id WHERE route_edges.route_id=$1)';
      params.push(plan_id);
    } else {
      sql += 'WITH biz AS (SELECT b.id, b.industry_id, b.number_of_employees, b.location_id, b.name, b.address FROM businesses b JOIN aro.fiber_plant ON fiber_plant.carrier_name = $1 AND fiber_plant.cbsa = $2 AND ST_DWithin(fiber_plant.geom::geography, b.geog, 152.4)';
      params.push(config.client_carrier_name);
      params.push(output.cbsa);
    }

    if (type === 'addressable') {
      params.push(options.boundary);
      sql += ' AND ST_Intersects(ST_GeomFromGeoJSON($'+params.length+')::geography, b.geog) GROUP BY b.id)';
    } else {
      sql += ' GROUP BY b.id)'
    }
  } else {
    params.push(options.boundary);
    sql += 'WITH biz AS (SELECT b.id, b.industry_id, b.number_of_employees, b.location_id, b.name, b.address FROM businesses b WHERE ST_Intersects(ST_GeomFromGeoJSON($1)::geography, b.geog))';
  }
  return sql;
}

MarketSize.calculate = function(plan_id, type, options, callback) {
  var filters = options.filters;
  var output = {};

  txain(function(callback) {
    database.findValue('SELECT cbsa FROM fiber_plant ORDER BY ST_Distance(geog, (SELECT area_centroid FROM custom.route WHERE id=$1)) LIMIT 1', [plan_id], 'cbsa', null, callback);
  })
  .then(function(cbsa, callback) {
    output.cbsa = cbsa;

    var params = [];
    var sql = prepareMarketSizeQuery(plan_id, type, options, params, output);

    sql += '\n SELECT spend.year, SUM(spend.monthly_spend * 12)::float as total FROM biz b'
    sql += '\n JOIN client_schema.industry_mapping m ON m.sic4 = b.industry_id JOIN client_schema.spend ON spend.industry_id = m.industry_id'

    if (!empty_array(filters.industry)) {
      params.push(filters.industry);
      sql += '\n AND spend.industry_id IN ($'+params.length+')';
    }
    if (!empty_array(filters.product)) {
      params.push(filters.product);
      sql += '\n AND spend.product_id IN ($'+params.length+')';
    }
    if (!empty_array(filters.employees_range)) {
      params.push(filters.employees_range);
      sql += '\n AND spend.employees_by_location_id IN ($'+params.length+')';
    }
    sql += '\n JOIN client_schema.employees_by_location e ON e.id = spend.employees_by_location_id AND e.min_value <= b.number_of_employees AND e.max_value >= b.number_of_employees'
    if (filters.customer_type) {
      params.push(filters.customer_type);
      sql += '\n JOIN client_schema.business_customer_types bct ON bct.business_id = b.id AND bct.customer_type_id=$'+params.length
    }
    sql += '\n GROUP BY spend.year ORDER BY spend.year ASC';

    database.query(sql, params, callback);
  })
  .then(function(market_size, callback) {
    output.market_size = market_size;

    var params = [];
    var sql = prepareMarketSizeQuery(plan_id, type, options, params, output);

    sql += multiline(function() {/*
      SELECT MAX(c.name) AS name, COUNT(*)::integer AS value FROM biz
      JOIN client.locations_carriers lc ON lc.location_id = biz.location_id
      JOIN carriers c ON lc.carrier_id = c.id
      GROUP BY c.id
    */})
    database.query(sql, params, callback);
  })
  .then(function(fair_share, callback) {
    output.fair_share = fair_share;
    output.market_size_existing = []; // TODO

    var current_carrier;
    var total = output.fair_share.reduce(function(total, item) {
      if (item.name === config.client_carrier_name) {
        current_carrier = item.value;
      }
      return item.value + total;
    }, 0);
    output.share = current_carrier / total;

    callback(null, output);
  })
  .end(callback);
};

MarketSize.export_businesses = function(plan_id, type, options, user, callback) {
  var filters = options.filters;
  var output = {};

  txain(function(callback) {
    database.findValue('SELECT cbsa FROM fiber_plant ORDER BY ST_Distance(geog, (SELECT area_centroid FROM custom.route WHERE id=$1)) LIMIT 1', [plan_id], 'cbsa', null, callback);
  })
  .then(function(cbsa, callback) {
    output.cbsa = cbsa;

    var params = [];
    var sql = prepareMarketSizeQuery(plan_id, type, options, params, output);

    sql += multiline(function() {;/*
      SELECT
        b.id,
        MAX(b.name),
        MAX(b.address),
        MAX(c_industries.industry_name) AS industry_name,
        MAX(industries.description) AS industry_description,
        MAX(e.value_range) AS number_of_employees,
        MAX(ct.name) AS type,
        SUM(spend.monthly_spend * 12)::float as total,
        spend.year
      FROM
        biz b
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
    */});
    if (filters.customer_type) {
      params.push(filters.customer_type);
      sql += '\n AND bct.customer_type_id=$'+params.length
    }
    sql += multiline(function() {;/*
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
      JOIN
        client_schema.industries c_industries
      ON
        spend.industry_id = c_industries.id
    */});
    sql += '\n GROUP BY b.id, year';
    database.query(sql, params, callback);
  })
  .then(function(rows, callback) {
    var years = [];
    rows.forEach(function(business) {
      if (years.indexOf(business.year) === -1) {
        years.push(business.year);
      }
    });
    years = years.sort();
    var columns = ['name', 'address', 'industry_name', 'industry_description', 'number_of_employees', 'type'].concat(years);
    var businesses = {};
    rows.forEach(function(business) {
      var id = business.id;
      business[business.year] = business.total;
      businesses[id] = _.extend(businesses[id] || {}, business);
    });
    businesses = _.values(businesses);
    var year = String(new Date().getFullYear());
    var total = businesses.reduce(function(total, business) {
      return total + (business[year] || 0);
    }, 0);
    businesses = _.values(businesses).map(function(business) {
      return columns.map(function(col) {
        return business[col];
      });
    });
    this.set('years', years);
    this.set('total', total);
    console.log('Market size total for current year:', total);
    stringify(businesses, callback);
  })
  .then(function(csv, callback) {
    var years = this.get('years');
    var header = ['Name', 'Address', 'Industry name', 'Industry description', 'Number of employees', 'Type'].concat(years);
    csv = header.join(',')+'\n'+csv;
    this.set('csv', csv);

    if (empty_array(filters.product)) return callback(null, []);
    var sql = 'SELECT product_type, product_name FROM client_schema.products WHERE id IN($1)';
    database.query(sql, [filters.product], callback);
  })
  .then(function(products, callback) {
    this.set('products', products);

    if (empty_array(filters.employees_range)) return callback(null, []);
    var sql = 'SELECT value_range FROM client_schema.employees_by_location WHERE id IN($1)';
    database.query(sql, [filters.employees_range], callback);
  })
  .then(function(employees_by_location, callback) {
    this.set('employees_by_location', employees_by_location);

    if (empty_array(filters.industry)) return callback(null, []);
    var sql = 'SELECT industry_name FROM client_schema.industries WHERE id IN($1)';
    database.query(sql, [filters.industry], callback);
  })
  .then(function(industries, callback) {
    this.set('industries', industries);

    var sql = 'SELECT name, area_name FROM custom.route WHERE id=$1';
    database.findOne(sql, [plan_id], callback);
  })
  .then(function(plan, callback) {
    var footer = [];
    footer.push(['Export Attributes']);
    if (user) {
      footer.push(['Created by:', user.first_name+' '+user.last_name]);
    }
    footer.push(['Created on:', moment().format('MMMM Do YYYY, h:mm:ss a')]);
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
    footer.push([]);
    stringify(footer, callback);
  })
  .then(function(footer, callback) {
    var csv = footer + this.get('csv');
    callback(null, csv, this.get('total'));
  })
  .end(callback);
};

MarketSize.market_size_for_location = function(location_id, filters, callback) {
  var output = {};

  txain(function(callback) {
    var params = [location_id];
    var sql = multiline(function() {;/*
      SELECT spend.year, SUM(spend.monthly_spend * 12)::float as total
      FROM aro.locations locations
      JOIN businesses b ON locations.id = b.location_id
      JOIN client_schema.business_customer_types bct ON bct.business_id = b.id
      JOIN client_schema.customer_types ct ON ct.id=bct.customer_type_id
      JOIN client_schema.industry_mapping m ON m.sic4 = b.industry_id
      JOIN client_schema.spend ON spend.industry_id = m.industry_id
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
      JOIN client_schema.employees_by_location e ON
        e.id = spend.employees_by_location_id
        AND e.min_value <= b.number_of_employees
       AND e.max_value >= b.number_of_employees
      WHERE locations.id = $1
      GROUP BY spend.year
      ORDER by spend.year
    */});
    database.query(sql, params, callback);
  })
  .then(function(market_size, callback) {
    output.market_size = market_size;

    var params = [location_id];
    var sql = multiline(function() {/*
      SELECT MAX(c.name) AS name, COUNT(*)::integer AS value FROM businesses biz
      JOIN locations l ON l.id = biz.location_id AND l.id = $1
      JOIN client.locations_carriers lc ON lc.location_id = biz.location_id
      JOIN carriers c ON lc.carrier_id = c.id
      GROUP BY c.id
    */})
    database.query(sql, params, callback);
  })
  .then(function(fair_share, callback) {
    output.fair_share = fair_share;
    callback(null, output);
  })
  .end(callback);
}

MarketSize.market_size_for_business = function(business_id, options, callback) {
  var output = {};
  var filters = options.filters;

  txain(function(callback) {
    var params = [business_id];
    var sql = multiline(function() {;/*
      SELECT spend.year, SUM(spend.monthly_spend * 12)::float as total
      FROM aro.locations locations
      JOIN businesses b ON locations.id = b.location_id
      JOIN client_schema.business_customer_types bct ON bct.business_id = b.id
      JOIN client_schema.customer_types ct ON ct.id=bct.customer_type_id
      JOIN client_schema.industry_mapping m ON m.sic4 = b.industry_id
      JOIN client_schema.spend ON spend.industry_id = m.industry_id
    */});
    if (!empty_array(filters.product)) {
      params.push(filters.product);
      sql += '\n AND spend.product_id IN ($'+params.length+')'
    }
    sql += multiline(function() {;/*
      JOIN client_schema.employees_by_location e ON
        e.id = spend.employees_by_location_id
        AND e.min_value <= b.number_of_employees
       AND e.max_value >= b.number_of_employees
      WHERE b.id = $1
      GROUP BY spend.year
      ORDER by spend.year
    */});
    database.query(sql, params, callback);
  })
  .then(function(market_size, callback) {
    output.market_size = market_size;

    var params = [business_id];
    var sql = multiline(function() {/*
      SELECT MAX(c.name) AS name, COUNT(*)::integer AS value FROM businesses biz
      JOIN locations l ON l.id = biz.location_id AND l.id = 1
      JOIN client.locations_carriers lc ON lc.location_id = biz.location_id
      JOIN carriers c ON lc.carrier_id = c.id
      WHERE biz.id = $1
      GROUP BY c.id
    */})
    database.query(sql, params, callback);
  })
  .then(function(fair_share, callback) {
    output.fair_share = fair_share;
    callback(null, output);
  })
  .end(callback);
};

MarketSize.fair_share_heatmap = function(viewport, callback) {
  txain(function(callback) {
    database.findOne('SELECT id FROM carriers WHERE name=$1', [config.client_carrier_name], callback);
  })
  .then(function(carrier, callback) {
    var params = [carrier.id];
    var sql = 'WITH '+viewport.fishnet;
    sql += multiline(function() {;/*
      SELECT ST_AsGeojson(fishnet.geom)::json AS geom

      , (SELECT COUNT(*)::integer FROM businesses biz
      JOIN locations ON fishnet.geom && locations.geom
      JOIN client.locations_carriers lc ON lc.location_id = biz.location_id
      JOIN carriers c ON lc.carrier_id = c.id AND c.id = $1
      WHERE biz.location_id = locations.id) AS carrier_current

      , (SELECT COUNT(*)::integer FROM businesses biz
      JOIN locations ON fishnet.geom && locations.geom
      JOIN client.locations_carriers lc ON lc.location_id = biz.location_id
      JOIN carriers c ON lc.carrier_id = c.id
      WHERE biz.location_id = locations.id) AS carrier_total

      FROM fishnet GROUP BY fishnet.geom
    */});
    database.query(sql, params, callback);
  })
  .then(function(rows, callback) {
    rows = rows.filter(function(row) {
      return row.carrier_total > 0;
    })

    var features = rows.map(function(row) {
      return {
        'type':'Feature',
        'properties': {
          'id': row.id,
          'density': row.carrier_total === 0 ? 0 : ((row.carrier_total - row.carrier_current)*100 / row.carrier_total),
          'carrier_total': row.carrier_total,
          'carrier_current': row.carrier_current,
        },
        'geometry': row.geom,
      };
    });

    var output = {
      'feature_collection': {
        'type':'FeatureCollection',
        'features': features,
      },
    };
    callback(null, output);
  })
  .end(callback);
}

module.exports = MarketSize;
