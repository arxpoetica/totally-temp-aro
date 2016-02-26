// Customer profile

var helpers = require('../helpers');
var config = helpers.config;
var database = helpers.database;
var txain = require('txain');
var _ = require('underscore');

var CustomerProfile = {};

function process_customer_types(metadata, customer_types, callback) {
  metadata.customer_types = customer_types;

  metadata.customers_businesses_total = customer_types
    .reduce((total, customer_type) => total + customer_type.businesses, 0);
  metadata.customers_households_total = customer_types
    .reduce((total, customer_type) => total + customer_type.households, 0);
  metadata.total_customers = metadata.customer_types
    .reduce((total, type) => total + type.businesses + type.households, 0);
  callback(null, metadata);
}

CustomerProfile.customer_profile_for_route = function(plan_id, metadata, callback) {
  var sql = `
    SELECT ct.name, SUM(households)::integer as households, SUM(businesses)::integer as businesses FROM (
      (SELECT
        hct.customer_type_id AS id, COUNT(*)::integer AS households, 0 as businesses
      FROM
        client.plan_targets t
      JOIN
        households h
      ON
        h.location_id=t.location_id
      JOIN
        client_schema.household_customer_types hct
      ON
        hct.household_id = h.id
      WHERE
        plan_id=$1
      GROUP BY hct.customer_type_id)

      UNION

      (SELECT
        bct.customer_type_id as id, 0 as households, COUNT(*)::integer as businesses
      FROM
        client.plan_targets t
      JOIN
        businesses b
      ON
        b.location_id=t.location_id
      JOIN
        client_schema.business_customer_types bct
      ON
        bct.business_id = b.id
      WHERE
        plan_id=$1
      GROUP BY bct.customer_type_id)
      ) t
    JOIN
      client_schema.customer_types ct
    ON
      ct.id=t.id
    GROUP BY
      ct.name
    ORDER BY
      ct.name
  `
  txain(function(callback) {
    database.query(sql, [plan_id], callback);
  })
  .then(function(customer_types, callback) {
    process_customer_types(metadata, customer_types, callback);
  })
  .end(callback);
};

CustomerProfile.customer_profile_all_cities = function(callback) {
  var metadata = []
  txain(function(callback) {
    database.query('SELECT id, city_name, ST_AsGeoJSON(cities.centroid)::json AS centroid FROM cities', callback);
  })
  .each(function(city, callback) {
    txain(function(callback) {
      var sql = `
        WITH biz AS (SELECT DISTINCT b.id FROM businesses b
          JOIN aro.fiber_plant
            ON fiber_plant.carrier_name = $1
            AND ST_DWithin(fiber_plant.geom::geography, b.geog, 152.4)
          JOIN cities c
            ON c.id = $2 AND c.buffer_geog && fiber_plant.geog)
        SELECT ct.name, COUNT(*)::integer as businesses, '0'::integer as households
        FROM biz b
        JOIN client.business_customer_types bct ON bct.business_id = b.id
        JOIN client.customer_types ct ON ct.id=bct.customer_type_id
        GROUP BY ct.name
        ORDER BY ct.name
      `
      database.query(sql, [config.client_carrier_name, city.id], callback);
    })
    .then(function(customer_types, callback) {
      city.customer_profile = {};
      metadata.push(city);
      process_customer_types(city.customer_profile, customer_types, callback);
    })
    .end(callback);
  })
  .then(function(callback) {
    callback(null, metadata);
  })
  .end(callback);
}

CustomerProfile.customer_profile_for_existing_fiber = function(plan_id, metadata, callback) {
  txain(function(callback) {
    database.findValue('SELECT cbsa FROM fiber_plant ORDER BY ST_Distance(geog, (SELECT area_centroid FROM client.plan WHERE id=$1)) LIMIT 1', [plan_id], 'cbsa', null, callback);
  })
  .then(function(cbsa, callback) {
    var sql = `
      WITH biz AS (SELECT DISTINCT b.id FROM businesses b JOIN aro.fiber_plant ON fiber_plant.carrier_name = $1 AND fiber_plant.cbsa = $2 AND ST_DWithin(fiber_plant.geom::geography, b.geog, 152.4))
      SELECT ct.name, COUNT(*)::integer as businesses, '0'::integer as households
      FROM biz b
      JOIN client.business_customer_types bct ON bct.business_id = b.id
      JOIN client.customer_types ct ON ct.id=bct.customer_type_id
      GROUP BY ct.name
      ORDER BY ct.name
    `
    database.query(sql, [config.client_carrier_name, cbsa], callback);
  })
  .then(function(customer_types, callback) {
    process_customer_types(metadata, customer_types, callback);
  })
  .end(callback);
};

CustomerProfile.customer_profile_for_boundary = function(type, boundary, callback) {
  var metadata = {};
  var sql = '';
  var params = [boundary];
  if (type === 'all') {
    sql = 'WITH biz AS (SELECT * FROM businesses b'
  } else if (type === 'addressable') {
    sql = 'WITH biz AS (SELECT DISTINCT b.id FROM businesses b JOIN aro.fiber_plant ON fiber_plant.carrier_name = $2 AND ST_DWithin(fiber_plant.geom::geography, b.geog, 152.4)'
    params.push(config.client_carrier_name);
  }
  sql += `
    WHERE ST_Intersects(ST_GeomFromGeoJSON($1)::geography, b.geog))

    SELECT ct.name, COUNT(*)::integer as businesses, '0'::integer as households
    FROM biz b
    JOIN client.business_customer_types bct ON bct.business_id = b.id
    JOIN client.customer_types ct ON ct.id=bct.customer_type_id
    GROUP BY ct.name
    ORDER BY ct.name
  `
  txain(function(callback) {
    database.query(sql, params, callback);
  })
  .then(function(customer_types, callback) {
    process_customer_types(metadata, customer_types, callback);
  })
  .end(callback);
};

module.exports = CustomerProfile;
