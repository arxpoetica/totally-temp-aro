#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -c "DROP SCHEMA IF EXISTS client_carrier_data CASCADE;"
${PSQL} -c "CREATE SCHEMA client_carrier_data;"

${PSQL} -c "DROP SCHEMA IF EXISTS aro_fiber_plant_data CASCADE;"
${PSQL} -c "CREATE SCHEMA aro_fiber_plant_data;"

${PSQL} -a -f $DIR/load_census_blocks_carriers.sql

${PSQL} -a -f $DIR/load_fiber_plant.sql