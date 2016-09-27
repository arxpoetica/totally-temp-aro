#!/bin/bash
set -e;


export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

# Master schema
${PSQL} -c "DROP SCHEMA IF EXISTS aro CASCADE;"
${PSQL} -c "CREATE SCHEMA aro;"

# New schema for location data partitions
${PSQL} -c "DROP SCHEMA IF EXISTS aro_location_data CASCADE;"
${PSQL} -c "CREATE SCHEMA aro_location_data;"