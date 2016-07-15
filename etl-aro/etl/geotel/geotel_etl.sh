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
wget https://s3.amazonaws.com/public.aro/geotel/cran_brdy_wcs_seattle.zip -nd -nc
unzip geotel_wirecenters.zip -d ${TMPDIR}
cd $TMPDIR;

# Create and load geotel.fiber_plant table
#${SHP2PGSQL} -c -s 4326 -g the_geom -W "latin1" geotel_fiber_ny.dbf geotel.fiber_plant | ${PSQL}

${SHP2PGSQL} -c -s 4326 -g the_geom -W "latin1" SeattleWA_WirecentersGeotel2016_SHP.dbf geotel.wirecenters | ${PSQL}