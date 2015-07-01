#!/bin/bash

export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Get geotel source file from S3
# TODO: obviously this needs to be dynamic and not hard-coded for a specific file

cd $GISROOT;
rm -f ${TMPDIR}/*.*
wget https://s3.amazonaws.com/public.aro/geotel/Geotel2015_KingWA.zip -nd -nc
unzip Geotel2015_KingWA.zip -d ${TMPDIR}
cd $TMPDIR;

# Create and load geotel.fiber_plant table
${SHP2PGSQL} -c -s 4326 -g the_geom -W "latin1" Geotel2015_KingWA_Shapefile.dbf geotel.fiber_plant | ${PSQL}