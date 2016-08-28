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
  "Test client.network_node_types has the expected columns" \
  "SELECT id, name, description FROM client.network_node_types LIMIT 1" \

assert_sql_equals \
  "Test client.network_node_types has 4 rows" \
  "SELECT COUNT(*) FROM client.network_node_types" \
  "4"

assert_sql \
  "Test client.household_install_costs has the expected columns" \
  "SELECT id, location_id, install_cost_per_hh, annual_recurring_cost_per_hh FROM client.household_install_costs LIMIT 1" \

assert_sql_above \
  "Test client.household_install_costs has at least one row" \
  "SELECT COUNT(*) FROM client.household_install_costs" \
  "0"

assert_sql \
  "Test client.customer_types has the expected columns" \
  "SELECT id, name FROM client.customer_types LIMIT 1" \

assert_sql_equals \
  "Test client.customer_types has 3 rows" \
  "SELECT COUNT(*) FROM client.customer_types" \
  "3"

assert_sql \
  "Test client.network_nodes has the expected columns" \
  "SELECT id, lat, lon, node_type_id, geog, geom, route_id FROM client.network_nodes LIMIT 1" \

assert_sql_above \
  "Test client.network_nodes has at least one row" \
  "SELECT COUNT(*) FROM client.network_nodes" \
  "0"

assert_sql \
  "Test client.products has the expected columns" \
  "SELECT id, product_type, product_name FROM client.products LIMIT 1" \

assert_sql_equals \
  "Test client.products has 27 rows" \
  "SELECT COUNT(*) FROM client.products" \
  "27"

assert_sql \
  "Test client.edge_network has the expected columns" \
  "SELECT id, gid, statefp, countyfp, edge_type, edge_length, source, target, geom FROM client.edge_network LIMIT 1" \

assert_sql_above \
  "Test client.edge_network has at least one row" \
  "SELECT COUNT(*) FROM client.edge_network" \
  "0"

assert_sql \
  "Test client.business_customer_types has the expected columns" \
  "SELECT id, business_id, customer_type_id FROM client.business_customer_types LIMIT 1" \

assert_sql_above \
  "Test client.business_customer_types has at least one row" \
  "SELECT COUNT(*) FROM client.business_customer_types" \
  "0"

assert_sql \
  "Test client.edge_network_vertices_pgr has the expected columns" \
  "SELECT id, cnt, chk, ein, eout, the_geom FROM client.edge_network_vertices_pgr LIMIT 1" \

assert_sql_above \
  "Test client.edge_network_vertices_pgr has at least one row" \
  "SELECT COUNT(*) FROM client.edge_network_vertices_pgr" \
  "0"

assert_sql \
  "Test client.household_customer_types has the expected columns" \
  "SELECT id, household_id, customer_type_id FROM client.household_customer_types LIMIT 1" \

assert_sql_above \
  "Test client.household_customer_types has at least one row" \
  "SELECT COUNT(*) FROM client.household_customer_types" \
  "0"

assert_sql \
  "Test client.graph_vertices_pgr has the expected columns" \
  "SELECT id, cnt, chk, ein, eout, the_geom FROM client.graph_vertices_pgr LIMIT 1" \

assert_sql_above \
  "Test client.graph_vertices_pgr has at least one row" \
  "SELECT COUNT(*) FROM client.graph_vertices_pgr" \
  "0"

assert_sql \
  "Test client.graph has the expected columns" \
  "SELECT id, old_id, sub_id, source, target, geom, gid, statefp, countyfp, edge_type, edge_length FROM client.graph LIMIT 1" \

assert_sql_above \
  "Test client.graph has at least one row" \
  "SELECT COUNT(*) FROM client.graph" \
  "0"

assert_sql \
  "Test client.location_entry_fees has the expected columns" \
  "SELECT id, location_id, entry_fee FROM client.location_entry_fees LIMIT 1" \

assert_sql_above \
  "Test client.location_entry_fees has at least one row" \
  "SELECT COUNT(*) FROM client.location_entry_fees" \
  "0"

assert_sql \
  "Test client.employees_by_location has the expected columns" \
  "SELECT id, value_range, min_value, max_value FROM client.employees_by_location LIMIT 1" \

assert_sql_equals \
  "Test client.employees_by_location has 12 rows" \
  "SELECT COUNT(*) FROM client.employees_by_location" \
  "12"

assert_sql \
  "Test client.spend has the expected columns" \
  "SELECT id, product_id, industry_id, employees_by_location_id, year, monthly_spend FROM client.spend LIMIT 1" \

assert_sql_above \
  "Test client.spend has at least one row" \
  "SELECT COUNT(*) FROM client.spend" \
  "0"

assert_sql \
  "Test client.industries has the expected columns" \
  "SELECT id, industry_name FROM client.industries LIMIT 1" \

assert_sql_equals \
  "Test client.industries has 10 rows" \
  "SELECT COUNT(*) FROM client.industries" \
  "10"

assert_sql \
  "Test client.industry_mapping has the expected columns" \
  "SELECT id, industry_id, sic4 FROM client.industry_mapping LIMIT 1" \

assert_sql_above \
  "Test client.industry_mapping has at least one row" \
  "SELECT COUNT(*) FROM client.industry_mapping" \
  "0"
assert_sql \
  "Test client.business_install_costs has the expected columns" \
  "SELECT id, business_id, install_cost, annual_recurring_cost FROM client.business_install_costs LIMIT 1" \

assert_sql_above \
  "Test client.business_install_costs has at least one row" \
  "SELECT COUNT(*) FROM client.business_install_costs" \
  "0"

assert_sql_equals \
  "Test client.spend has correct monthly_spend data" \
  "SELECT COUNT(*) FROM client.spend WHERE monthly_spend = 'NaN'" \
  "0"
