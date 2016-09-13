#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

# TEMPORARY SAFETY MEASURE
# ${PSQL} -c "DROP SCHEMA IF EXISTS businesses CASCADE;"
# ${PSQL} -c "CREATE SCHEMA businesses;"