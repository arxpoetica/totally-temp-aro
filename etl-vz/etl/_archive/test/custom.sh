#!/bin/bash
set -e;


# TODO: move environment variables to configuration recipes so they can be set in a single location
export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

source "$(dirname $0)/util.sh"

assert_sql \
  "Test custom.route has the expected columns" \
  "SELECT id, name, number_of_strands, cable_type FROM custom.route LIMIT 1" \

assert_sql \
  "Test custom.route_sources has the expected columns" \
  "SELECT id, network_node_id, route_id, vertex_id FROM custom.route_sources LIMIT 1" \

assert_sql \
  "Test custom.route_targets has the expected columns" \
  "SELECT id, location_id, route_id, vertex_id FROM custom.route_targets LIMIT 1" \

assert_sql \
  "Test custom.route_edges has the expected columns" \
  "SELECT id, route_id, edge_id FROM custom.route_edges LIMIT 1" \
