#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP SCHEMA IF EXISTS aro CASCADE;"
${PSQL} -c "CREATE SCHEMA aro;"