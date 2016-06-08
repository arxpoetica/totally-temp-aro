#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Create ARO carriers table
${PSQL} -a -f $DIR/create_aro_carriers.sql

# Create ARO county subdivisions
${PSQL} -a -f $DIR/create_aro_cousub.sql

# Create aro edges from tiger edges
${PSQL} -a -f $DIR/create_aro_edges.sql

# Create aro census_blocks from tiger tabblock
${PSQL} -a -f $DIR/create_aro_census_blocks.sql

# Create and load aro.fiber_plant table from geotel.fiber_plant table
${PSQL} -a -f $DIR/create_aro_fiber_plant.sql

# Create and load aro.wirecenters table from geotel.wirecenters table
${PSQL} -a -f $DIR/create_aro_wirecenters.sql

# # Create aro.industries table from infousa.businesses table
${PSQL} -a -f $DIR/create_aro_industries.sql

# Create aro.locations table from infousa.businesses table
${PSQL} -a -f $DIR/create_aro_locations.sql

# Create aro.businesses table from infousa.businesses table
${PSQL} -a -f $DIR/create_aro_businesses.sql

# Create aro.btemp_households from temp_hh.households table
${PSQL} -a -f $DIR/create_aro_temp_households.sql

# Create aro.aro_household_summary table. This will reference the locations table
${PSQL} -a -f $DIR/create_aro_households.sql

# Create aro.towers table from sita.towers table
${PSQL} -a -f $DIR/create_aro_towers.sql

# Create aro.cities table
${PSQL} -a -f $DIR/create_aro_cities.sql

# Create aro.algorithms table
${PSQL} -a -f $DIR/create_aro_algorithms.sql

${PSQL} -a -f $DIR/calculate_aro_locations_totals.sql
