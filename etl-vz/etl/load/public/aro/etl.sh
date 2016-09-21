#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/load_aro_edges.sql

${PSQL} -a -f $DIR/load_cosub.sql

${PSQL} -a -f $DIR/load_census_blocks.sql

${PSQL} -a -f $DIR/load_cities.sql

${PSQL} -a -f $DIR/load_aro_states.sql

