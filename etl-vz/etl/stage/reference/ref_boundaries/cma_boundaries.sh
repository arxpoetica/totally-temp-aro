#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

cd $GISROOT;

rm -f ${TMPDIR}/*.*
if [ ! -f cma.zip ]; then
	aws s3 cp s3://public.aro/proto/boundaries/cma.zip $GISROOT/cma.zip
fi
$UNZIPTOOL cma.zip -d ${TMPDIR}
${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/cma.dbf ref_boundaries.cma | ${PSQL}
