#!/bin/bash

# TODO: move environment variables to configuration recipes so they can be set in a single location
export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

${PSQL} -c "DROP SCHEMA IF EXISTS aro CASCADE;"
${PSQL} -c "CREATE SCHEMA aro;"