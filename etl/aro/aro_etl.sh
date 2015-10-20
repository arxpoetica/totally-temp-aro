#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Create and load aro.fiber_plant table from source_colt.
${PSQL} -a -f $DIR/create_aro_fiber_plant.sql

# Create aro.businesses table from source_colt.locations table
${PSQL} -a -f $DIR/create_aro_businesses.sql

# Create aro.locations table from source_colt.locations table
${PSQL} -a -f $DIR/create_aro_locations.sql
