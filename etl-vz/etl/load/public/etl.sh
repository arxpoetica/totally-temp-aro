#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from


-----   ARO Schema  ----

----- Client Schema ----

${PSQL} -a -f $DIR/load_service_areas.sql

${PSQL} -a -f $DIR/load_analysis_areas.sql

${PSQL} -a -f $DIR/load_head_plans.sql

${PSQL} -a -f $DIR/load_equipment.sql


