#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Create ARO carriers table
${PSQL} -a -f $DIR/create_aro_carriers.sql

# Create and load aro.fiber_plant table from source_colt.
${PSQL} -a -f $DIR/create_aro_fiber_plant.sql

# Create aro.locations table from source_colt.locations table
${PSQL} -a -f $DIR/create_aro_locations.sql

# Create aro.verizon_locations table from source_colt.verizon_buildings table
# NOTE: this table is not used in the app, but just for queries requested by the client.
${PSQL} -a -f $DIR/create_aro_verizon_locations.sql

# Create aro.businesses table from source_colt.locations table
${PSQL} -a -f $DIR/create_aro_businesses.sql

# Create geographic boundaries around Frankfurt and Paris based on locations
${PSQL} -a -f $DIR/create_aro_cities.sql

# Create empty tables (empty for Colt, at least)
${PSQL} -a -f $DIR/create_aro_census_blocks.sql

${PSQL} -a -f $DIR/create_aro_cousub.sql

${PSQL} -a -f $DIR/create_aro_edges.sql

${PSQL} -a -f $DIR/create_aro_households.sql

${PSQL} -a -f $DIR/create_aro_industries.sql

#insert industry file into industries table
cat /$DIR/local_data/industries.csv | ${PSQL} -a -c "COPY aro.industries\
    (id,description) \
    FROM STDIN DELIMITER ',' CSV HEADER encoding 'windows-1251';"

${PSQL} -a -f $DIR/create_aro_road_nodes.sql

${PSQL} -a -f $DIR/create_aro_wirecenters.sql
