#!/bin/bash

# TODO: move environment variables to configuration recipes so they can be set in a single location
export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

source "$(dirname $0)/util.sh"

assert_sql \
  "Test aro.wirecenters has the expected columns" \
  "SELECT id, gid, state, wirecenter, aocn, aocn_name, geog, geom FROM aro.wirecenters LIMIT 1" \

assert_sql_above \
  "Test aro.wirecenters has at least one row" \
  "SELECT COUNT(*) FROM aro.wirecenters" \
  "0"

assert_sql \
  "Test aro.industries has the expected columns" \
  "SELECT id, description FROM aro.industries LIMIT 1" \

assert_sql_above \
  "Test aro.industries has at least one row" \
  "SELECT COUNT(*) FROM aro.industries" \
  "0"

assert_sql \
  "Test aro.businesses has the expected columns" \
  "SELECT id, location_id, industry_id, name, address, number_of_employees, annual_recurring_cost, geog FROM aro.businesses LIMIT 1" \

assert_sql_above \
  "Test aro.businesses has at least one row" \
  "SELECT COUNT(*) FROM aro.businesses" \
  "0"

assert_sql \
  "Test aro.locations has the expected columns" \
  "SELECT id, address, city, state, zipcode, lat, lon, geog, wirecenter_id, geom FROM aro.locations LIMIT 1" \

assert_sql_above \
  "Test aro.locations has at least one row" \
  "SELECT COUNT(*) FROM aro.locations" \
  "0"

assert_sql \
  "Test aro.cousub has the expected columns" \
  "SELECT gid, statefp, countyfp, geoid, name, aland, awater, intptlat, intptlon, geom FROM aro.cousub LIMIT 1" \

assert_sql_above \
  "Test aro.cousub has at least one row" \
  "SELECT COUNT(*) FROM aro.cousub" \
  "0"

assert_sql \
  "Test aro.households has the expected columns" \
  "SELECT id, location_id, number_of_households FROM aro.households LIMIT 1" \

assert_sql_above \
  "Test aro.households has at least one row" \
  "SELECT COUNT(*) FROM aro.households" \
  "0"

assert_sql \
  "Test aro.edges has the expected columns" \
  "SELECT gid, statefp, countyfp, edge_type, edge_length, geom, geog FROM aro.edges LIMIT 1" \

assert_sql_above \
  "Test aro.edges has at least one row" \
  "SELECT COUNT(*) FROM aro.edges" \
  "0"

assert_sql \
  "Test aro.census_blocks has the expected columns" \
  "SELECT gid, statefp, countyfp, tabblock_id, name, aland, awater, intptlat, intptlon, geom, hh_2014 FROM aro.census_blocks LIMIT 1" \

assert_sql_above \
  "Test aro.census_blocks has at least one row" \
  "SELECT COUNT(*) FROM aro.census_blocks" \
  "0"

assert_sql \
  "Test aro.fiber_plant has the expected columns" \
  "SELECT id, gid, carrier_name, cbsa, state, plant_type, zipcode, geog, geom FROM aro.fiber_plant LIMIT 1" \

assert_sql_above \
  "Test aro.fiber_plant has at least one row" \
  "SELECT COUNT(*) FROM aro.fiber_plant" \
  "0"
