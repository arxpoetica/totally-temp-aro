#!/bin/bash

#TODO Refactor into Modules + Add view Schema
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
${PSQL} -a -f $DIR/load_views.sql


