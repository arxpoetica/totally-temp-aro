#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP SCHEMA IF EXISTS ref_towers CASCADE;"
${PSQL} -c "CREATE SCHEMA ref_towers;"