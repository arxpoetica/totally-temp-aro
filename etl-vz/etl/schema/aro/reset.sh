#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

# Master schema
${PSQL} -c "DROP SCHEMA IF EXISTS aro CASCADE;"
${PSQL} -c "CREATE SCHEMA aro;"

# New schema for child tables 
${PSQL} -c "DROP SCHEMA IF EXISTS aro_data CASCADE;"
${PSQL} -c "CREATE SCHEMA aro_data;"