#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Get geotel source file from S3
# TODO: obviously this needs to be dynamic and not hard-coded for a specific file

cd $GISROOT;
rm -f ${TMPDIR}/*.*
wget https://s3.amazonaws.com/public.aro/geotel/geotel_fiber_ny.zip -nd -nc
wget https://s3.amazonaws.com/public.aro/geotel/geotel_wirecenters_ny.zip -nd -nc
for z in geotel_*_ny.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done
cd $TMPDIR;

# Create and load geotel.fiber_plant table
${SHP2PGSQL} -c -s 4326 -g the_geom -W "latin1" geotel_fiber_ny.dbf geotel.fiber_plant | ${PSQL}

${SHP2PGSQL} -c -s 4326 -g the_geom -W "latin1" geotel_wirecenters_ny.dbf geotel.wirecenters | ${PSQL}

# create a basic Carriers table
${PSQL} -a -f $DIR/geotel.carrier.sql

# create a alias table (This will be moved at some point)
${PSQL} -a -f $DIR/geotel.carrier_alias.sql

# Buffer Geotel routes and index into carrier table
${PSQL} -a -f $DIR/buffered_routes.sql
