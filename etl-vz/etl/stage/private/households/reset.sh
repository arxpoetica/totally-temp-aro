#!/bin/bash

# resets schema and loads functions for households ETL

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -c "DROP SCHEMA IF EXISTS households CASCADE;"
${PSQL} -c "CREATE SCHEMA households;"

${PSQL} -a -f $DIR/households.sql