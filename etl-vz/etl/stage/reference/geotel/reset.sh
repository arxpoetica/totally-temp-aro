#!/bin/bash
set -e;


export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -c "DROP SCHEMA IF EXISTS geotel CASCADE;"
${PSQL} -c "CREATE SCHEMA geotel;"

${PSQL} -c "DROP SCHEMA IF EXISTS geotel_fiber_data CASCADE;"
${PSQL} -c "CREATE SCHEMA geotel_fiber_data;"

${PSQL} -c "DROP SCHEMA IF EXISTS geotel_wirecenter_data CASCADE;"
${PSQL} -c "CREATE SCHEMA geotel_wirecenter_data;"

# Load Geotel paritioning functions
${PSQL} -a -f $DIR/geotel.sql

# Create Geotel Fiber master table (geotel.fiber_plant)
${PSQL} -c "SELECT create_geotel_fiber_master_table('geotel');"

# Create Geotel Wirecenters master table (geotel.wirecenters)
${PSQL} -c "SELECT create_geotel_wirecenters_master_table('geotel');"