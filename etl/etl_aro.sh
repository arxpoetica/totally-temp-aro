#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

GISROOT=$ARO_DATA_ROOT
TMPDIR=/tmp/arotmp
UNZIPTOOL=unzip
SHP2PGSQL=${PGBIN}/shp2pgsql
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

mkdir -p $TMPDIR

${PSQL} -c "DROP SCHEMA IF EXISTS aro CASCADE;"
${PSQL} -c "CREATE SCHEMA aro;"


echo 'Creating ARO UOM table'
${PSQL} -f $DIR/sql/create_aro_uom.sql

echo 'Creating ARO carriers table'
${PSQL} -f $DIR/sql/create_aro_carriers.sql

echo 'Creating ARO county subdivisions'
${PSQL} -f $DIR/sql/create_aro_cousub.sql

echo 'Creating ARO edges from tiger edges'
${PSQL} -f $DIR/sql/create_aro_edges.sql

echo 'Creating ARO census_blocks from tiger tabblock'
${PSQL} -f $DIR/sql/create_aro_census_blocks.sql

echo 'Creating and load ARO fiber_plant table from geotel.fiber_plant table'
${PSQL} -f $DIR/sql/create_aro_fiber_plant.sql

echo 'Creating and load ARO wirecenters table from geotel.wirecenters table'
${PSQL} -f $DIR/sql/create_aro_wirecenters.sql

echo 'Creating ARO industries table from infousa.businesses table'
${PSQL} -f $DIR/sql/create_aro_industries.sql

echo 'Creating ARO locations table from businesses and households sources'
${PSQL} -f $DIR/sql/create_aro_locations.sql

echo 'Creating ARO businesses table from infousa.businesses table'
${PSQL} -f $DIR/sql/create_aro_businesses.sql

echo 'Creating ARO aro_household_summary table. This will reference the locations table'
${PSQL} -f $DIR/sql/create_aro_households.sql

echo 'Creating ARO towers table'
${PSQL} -f $DIR/sql/create_aro_towers.sql

echo 'Creating ARO cities table'
${PSQL} -f $DIR/sql/create_aro_cities.sql

echo 'Creating ARO algorithms table'
${PSQL} -f $DIR/sql/create_aro_algorithms.sql

echo 'Updating location totals'
${PSQL} -f $DIR/sql/calculate_aro_locations_totals.sql