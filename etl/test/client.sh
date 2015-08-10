#!/bin/bash

# TODO: move environment variables to configuration recipes so they can be set in a single location
export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

source "$(dirname $0)/util.sh"

assert_sql_equals "Test client.network_node_types has 4 rows" "SELECT COUNT(*) FROM client.network_node_types" "4"
assert_sql_above "Test client.network_nodes has at least one row" "SELECT COUNT(*) FROM client.network_nodes" "0"
assert_sql_equals "Test client.spend has correct monthly_spend data" "SELECT COUNT(*) FROM client.spend WHERE monthly_spend = 'NaN'" "0"
