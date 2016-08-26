#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd $GISROOT;

rm -f ${TMPDIR}/*.*
aws s3 cp s3://public.aro/proto/boundaries/df_polygons.zip $GISROOT/cma.zip
$UNZIPTOOL df_polygons.zip -d ${TMPDIR}
${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/df_polygons.dbf boundaries.directional_facilities | ${PSQL}