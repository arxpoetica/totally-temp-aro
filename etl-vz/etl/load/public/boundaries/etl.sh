#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/load_service_areas.sql

#Comment this out until S3 Buckets resolved
#${PSQL} -a -f $DIR/load_analysis_areas.sql

