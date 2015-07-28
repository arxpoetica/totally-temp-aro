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

# Create road nodes from tiger edges
# ${PSQL} -a -f $DIR/create_aro_road_nodes.sql

# Create and load aro.fiber_plant table from geotel.fiber_plant table
${PSQL} -a -f $DIR/create_aro_fiber_plant.sql

# Create and load aro.wirecenters table from geotel.wirecenters table
${PSQL} -a -f $DIR/create_aro_wirecenters.sql

# Create and load aro.splice_points table from aro.fiber_plant table
${PSQL} -a -f $DIR/create_aro_splice_points.sql

# # Create aro.industries table from infousa.businesses table
${PSQL} -a -f $DIR/create_aro_industries.sql

# Create aro.businesses table from infousa.businesses table
${PSQL} -a -f $DIR/create_aro_businesses.sql

# Create aro.locations table from infousa.businesses table
${PSQL} -a -f $DIR/create_aro_locations.sql

# Create aro.aro_household_summary table. This will reference the locations table
${PSQL} -a -f $DIR/create_aro_household_summary.sql

# Create aro.route table
${PSQL} -a -f $DIR/create_aro_route.sql

# Create aro.route_sources table
${PSQL} -a -f $DIR/create_aro_route_sources.sql

# Create aro.route_targets table
${PSQL} -a -f $DIR/create_aro_route_targets.sql

# Create aro.route_edges table
${PSQL} -a -f $DIR/create_aro_route_edges.sql
