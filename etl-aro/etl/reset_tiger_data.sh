#!/bin/bash


export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP EXTENSION IF EXISTS postgis_tiger_geocoder CASCADE;"
${PSQL} -c "DROP SCHEMA IF EXISTS tiger_data CASCADE;"
${PSQL} -c "DROP SCHEMA IF EXISTS tiger_staging CASCADE;"
${PSQL} -c "DROP SCHEMA IF EXISTS tiger CASCADE;"
${PSQL} -c "CREATE EXTENSION postgis_tiger_geocoder;"
${PSQL} -c "ALTER SCHEMA tiger OWNER TO aro;"
${PSQL} -c "ALTER SCHEMA tiger_data OWNER TO aro;"
${PSQL} -c "ALTER TABLE tiger.cousub OWNER TO aro;"
${PSQL} -c "ALTER TABLE tiger.edges OWNER TO aro;"
${PSQL} -c "ALTER TABLE tiger.tabblock OWNER TO aro;"