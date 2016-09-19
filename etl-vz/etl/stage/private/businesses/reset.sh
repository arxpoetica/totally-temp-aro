#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP SCHEMA IF EXISTS businesses CASCADE;"
${PSQL} -c "CREATE SCHEMA businesses;"

# Create the functions for loading all types of VZ businesses
${PSQL} -a -f $DIR/create_vz_businesses.sql

