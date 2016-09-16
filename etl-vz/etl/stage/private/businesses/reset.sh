#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP SCHEMA IF EXISTS businesses CASCADE;"
${PSQL} -c "CREATE SCHEMA businesses;"

${PSQL} -c "DROP SCHEMA IF EXISTS businesses_data CASCADE;"
${PSQL} -c "CREATE SCHEMA businesses_data;"

