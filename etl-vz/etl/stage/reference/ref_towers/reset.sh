#!/bin/bash
set -e;


export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP SCHEMA IF EXISTS ref_towers CASCADE;"
${PSQL} -c "CREATE SCHEMA ref_towers;"

${PSQL} -c "DROP SCHEMA IF EXISTS ref_towers_data CASCADE;"
${PSQL} -c "CREATE SCHEMA ref_towers_data;"