#!/bin/bash
set -e;


#TODO Refactor into Modules + Add view Schema
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/load_views.sql


