#!/bin/bash

export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_client_graph.sql

# Populates a location entry fees table with fake data for 'client'. This should be replaced with real data later.
${PSQL} -a -f $DIR/load_location_entry_fees.sql

# Populates a location entry fees table with fake data for 'client'. This should be replaced with real data later.
${PSQL} -a -f $DIR/load_business_install_costs.sql
