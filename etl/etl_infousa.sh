#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

GISROOT=$ARO_DATA_ROOT/infousa
TMPDIR=/tmp/arotmp
UNZIPTOOL=unzip
SHP2PGSQL=${PGBIN}/shp2pgsql
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

mkdir -p $TMPDIR

${PSQL} -c "DROP SCHEMA IF EXISTS infousa CASCADE;"
${PSQL} -c "CREATE SCHEMA infousa;"

${PSQL} -a -f $DIR/sql/create_infousa_businesses.sql
${PSQL} -a -f $DIR/sql/create_infousa_households.sql

# Use lower case state names. FIPS codes unnecessary here as well.
declare -a STATE_ARRAY=( 'ny' 'wa' )

cd $GISROOT;

for STATE in "${STATE_ARRAY[@]}"
do
    rm -f ${TMPDIR}/*.*
    $UNZIPTOOL -p businesses_${STATE}.zip | ${PSQL} -a -c "COPY infousa.businesses FROM STDIN DELIMITER ',' CSV HEADER;"
    $UNZIPTOOL -p households_${STATE}.zip | ${PSQL} -a -c "COPY infousa.households (address, city, state, zip5, lon, lat, geog) FROM STDIN DELIMITER ',' CSV HEADER;"
done

# Optimize tables
${PSQL} -a -f $DIR/sql/optimize_infousa_businesses.sql
${PSQL} -a -f $DIR/sql/optimize_infousa_households.sql