#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP SCHEMA IF EXISTS temp_hh CASCADE;"
${PSQL} -c "CREATE SCHEMA temp_hh;"