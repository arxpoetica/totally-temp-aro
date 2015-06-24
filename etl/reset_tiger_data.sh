#!/bin/bash

# TODO: move environment variables to configuration recipes so they can be set in a single location
export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

${PSQL} -c "DROP EXTENSION IF EXISTS postgis_tiger_geocoder CASCADE;"
${PSQL} -c "DROP SCHEMA IF EXISTS tiger_data CASCADE;"
${PSQL} -c "DROP SCHEMA IF EXISTS tiger_staging CASCADE;"
${PSQL} -c "DROP SCHEMA IF EXISTS tiger CASCADE;"
${PSQL} -c "CREATE EXTENSION postgis_tiger_geocoder;"