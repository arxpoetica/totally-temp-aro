#!/bin/bash
set -e;


export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP SCHEMA IF EXISTS demographics CASCADE;"
${PSQL} -c "CREATE SCHEMA demographics;"