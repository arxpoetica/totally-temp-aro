#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/load_businesses.sql

#${PSQL} -a -f $DIR/load_households.sql

#${PSQL} -a -f $DIR/load_towers.sql

${PSQL} -a -f $DIR/load_industries.sql

${PSQL} -a -f $DIR/load_locations.sql


