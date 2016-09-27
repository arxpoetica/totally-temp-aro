#!/bin/bash
set -e;


export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

${PSQL} -c "DROP SCHEMA IF EXISTS ref_businesses CASCADE;"
${PSQL} -c "CREATE SCHEMA ref_businesses;"

# Functions for creating and loading tables for InfoUSA businesses
${PSQL} -a -f $DIR/create_infousa_businesses.sql
