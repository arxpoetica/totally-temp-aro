#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Partition schema for edges
${PSQL} -c "DROP SCHEMA IF EXISTS aro_edges_data CASCADE;"
${PSQL} -c "CREATE SCHEMA aro_edges_data;"

${PSQL} -c "DROP SCHEMA IF EXISTS aro_edges_data CASCADE;"
${PSQL} -c "CREATE SCHEMA aro_edges_data;"

${PSQL} -a -f $DIR/load_aro_edges.sql

