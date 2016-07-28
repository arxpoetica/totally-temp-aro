#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

GISROOT=/vagrant/aro-app-data/geotel
TMPDIR=/tmp/arotmp
UNZIPTOOL=unzip
SHP2PGSQL=${PGBIN}/shp2pgsql
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

mkdir -p $TMPDIR

${PSQL} -c "DROP SCHEMA IF EXISTS geotel CASCADE;"
${PSQL} -c "CREATE SCHEMA geotel;"


# Use lower case state names. FIPS codes unnecessary here as well.
declare -a STATE_ARRAY=( 'ny' 'wa' )
state_array_len=${#STATE_ARRAY[@]}

cd $GISROOT;
rm -f ${TMPDIR}/*.*


# There is always at least one state, so unzip the files and create the tables
$UNZIPTOOL geotel_fiber_${STATE_ARRAY[0]}.zip -d ${TMPDIR}
${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/geotel_fiber_${STATE_ARRAY[0]}.dbf geotel.fiber_plant | ${PSQL}
$UNZIPTOOL geotel_wirecenters_${STATE_ARRAY[0]}.zip -d ${TMPDIR}
${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/geotel_wirecenters_${STATE_ARRAY[0]}.dbf geotel.wirecenters | ${PSQL}
# If there are two or more states, loop through the rest and append
if [ ${state_array_len} > 1 ]; then
    for ((i=1; i<$state_array_len; i++ ));
    do
        rm -f ${TMPDIR}/*.*
        $UNZIPTOOL geotel_fiber_${STATE_ARRAY[i]}.zip -d ${TMPDIR}
        ${SHP2PGSQL} -a -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/geotel_fiber_${STATE_ARRAY[i]}.dbf geotel.fiber_plant | ${PSQL}
        $UNZIPTOOL geotel_wirecenters_${STATE_ARRAY[i]}.zip -d ${TMPDIR}
        ${SHP2PGSQL} -a -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/geotel_wirecenters_${STATE_ARRAY[i]}.dbf geotel.wirecenters | ${PSQL}
    done
fi

# create a basic Carriers table
${PSQL} -a -f $DIR/sql/geotel.carrier.sql

# create a alias table (This will be moved at some point)
${PSQL} -a -f $DIR/sql/geotel.carrier_alias.sql

# Buffer Geotel routes and index into carrier table
${PSQL} -a -f $DIR/sql/buffered_routes.sql
