#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP SCHEMA IF EXISTS client CASCADE;"
${PSQL} -c "CREATE SCHEMA client;"