#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/load_carriers.sql

${PSQL} -a -f $DIR/load_fiber_plant.sql

${PSQL} -a -f $DIR/load_census_blocks_carriers.sql

