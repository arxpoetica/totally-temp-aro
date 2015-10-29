#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP SCHEMA IF EXISTS source_colt CASCADE;"
${PSQL} -c "CREATE SCHEMA source_colt;"

