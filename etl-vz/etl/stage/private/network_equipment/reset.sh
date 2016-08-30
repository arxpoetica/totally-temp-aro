#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

${PSQL} -c "DROP SCHEMA IF EXISTS network_equipment CASCADE;"
${PSQL} -c "CREATE SCHEMA network_equipment;"