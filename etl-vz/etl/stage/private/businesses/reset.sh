#!/bin/bash
set -e;


export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# TEMPORARY FAILSAFE
# ${PSQL} -c "DROP SCHEMA IF EXISTS businesses CASCADE;"
# ${PSQL} -c "CREATE SCHEMA businesses;"

# Create the functions for loading all types of VZ businesses
${PSQL} -a -f $DIR/create_vz_businesses.sql

