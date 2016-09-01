#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP SCHEMA IF EXISTS ref_businesses CASCADE;"
${PSQL} -c "CREATE SCHEMA ref_businesses;"

${PSQL} -c "DROP SCHEMA IF EXISTS ref_businesses_data CASCADE;"
${PSQL} -c "CREATE SCHEMA ref_businesses_data;"
