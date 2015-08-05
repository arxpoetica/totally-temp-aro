#!/bin/bash

export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_aro_cousub.sql

# Create aro edges from tiger edges
${PSQL} -a -f $DIR/create_aro_edges.sql

# Create aro census_blocks from tiger tabblock
${PSQL} -a -f $DIR/create_aro_census_blocks.sql

# Create road nodes from tiger edges
# ${PSQL} -a -f $DIR/create_aro_road_nodes.sql

# Create and load aro.fiber_plant table from geotel.fiber_plant table
${PSQL} -a -f $DIR/create_aro_fiber_plant.sql

# Create and load aro.wirecenters table from geotel.wirecenters table
${PSQL} -a -f $DIR/create_aro_wirecenters.sql

# # Create aro.industries table from infousa.businesses table
${PSQL} -a -f $DIR/create_aro_industries.sql

# Create aro.businesses table from infousa.businesses table
${PSQL} -a -f $DIR/create_aro_businesses.sql

# Create aro.locations table from infousa.businesses table
${PSQL} -a -f $DIR/create_aro_locations.sql

# Create aro.aro_household_summary table. This will reference the locations table
${PSQL} -a -f $DIR/create_aro_households.sql
