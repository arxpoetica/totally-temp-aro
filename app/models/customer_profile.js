// Customer profile

var helpers = require('../helpers');
var config = helpers.config;
var database = helpers.database;
var multiline = require('multiline');
var txain = require('txain');
var _ = require('underscore');

var CustomerProfile = {};

CustomerProfile.customer_profile_for_route = function(plan_id, callback) {
  var sql = multiline(function(){;/*
    SELECT ct.name, SUM(households)::integer as households, SUM(businesses)::integer as businesses FROM (
      (SELECT
        hct.customer_type_id AS id, COUNT(*)::integer AS households, 0 as businesses
      FROM
        custom.route_targets t
      JOIN
        households h
      ON
        h.location_id=t.location_id
      JOIN
        client_schema.household_customer_types hct
      ON
        hct.household_id = h.id
      WHERE
        route_id=$1
      GROUP BY hct.customer_type_id)

      UNION

      (SELECT
        bct.customer_type_id as id, 0 as households, COUNT(*)::integer as businesses
      FROM
        custom.route_targets t
      JOIN
        businesses b
      ON
        b.location_id=t.location_id
      JOIN
        client_schema.business_customer_types bct
      ON
        bct.business_id = b.id
      WHERE
        route_id=$1
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
  */});
  database.query(sql, [plan_id], callback);
};

CustomerProfile.customer_profile_for_existing_fiber = function(callback) {
  var sql = multiline(function(){;/*
    WITH biz AS (SELECT b.id FROM businesses b JOIN aro.fiber_plant ON fiber_plant.carrier_name = $1 AND ST_DWithin(fiber_plant.geom::geography, b.geog, 152.4))
    SELECT ct.name, COUNT(*)::integer as businesses, '0'::integer as households
    FROM biz b
    JOIN client.business_customer_types bct ON bct.business_id = b.id
    JOIN client.customer_types ct ON ct.id=bct.customer_type_id
    GROUP BY ct.name
    ORDER BY ct.name
  */});
  database.query(sql, [config.client_carrier_name], callback);
};

CustomerProfile.customer_profile_for_boundary = function(boundary, callback) {
  var sql = multiline(function(){;/*
    WITH biz AS (SELECT * FROM businesses b WHERE ST_Intersects(ST_GeomFromGeoJSON($1)::geography, b.geog))
    SELECT ct.name, COUNT(*)::integer as businesses, '0'::integer as households
    FROM biz b
    JOIN client.business_customer_types bct ON bct.business_id = b.id
    JOIN client.customer_types ct ON ct.id=bct.customer_type_id
    GROUP BY ct.name
    ORDER BY ct.name
  */});
  database.query(sql, [boundary], callback);
};

module.exports = CustomerProfile;
