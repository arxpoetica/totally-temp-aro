#!/bin/bash
set -e;


export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -c "DROP SCHEMA IF EXISTS ref_households CASCADE;"
${PSQL} -c "CREATE SCHEMA ref_households;"

${PSQL} -a -f $DIR/create_infousa_households.sql
