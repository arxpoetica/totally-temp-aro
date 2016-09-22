#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Partition schema
${PSQL} -c "DROP SCHEMA IF EXISTS aro_location_data CASCADE;"
${PSQL} -c "CREATE SCHEMA aro_location_data;"

${PSQL} -c "DROP SCHEMA IF EXISTS aro_location_data CASCADE;"
${PSQL} -c "CREATE SCHEMA aro_location_data;"

# Create the functions to load partitioned businesses
${PSQL} -a -f $DIR/load_businesses.sql

# Create the functions to load partitioned locations
${PSQL} -a -f $DIR/load_locations.sql

# Create the functions to load partitioned towers
${PSQL} -a -f $DIR/load_towers.sql



