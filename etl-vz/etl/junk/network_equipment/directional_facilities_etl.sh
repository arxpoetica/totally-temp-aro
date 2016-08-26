#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_directional_facilities.sql

cd $GISROOT;

rm -f ${TMPDIR}/*.*
# Directional Facilities for the whole country, rather than by state
aws s3 cp s3://public.aro/proto/network_equipment/directional_facilities.zip $GISROOT/directional_facilities.zip
$UNZIPTOOL directional_facilities.zip -d ${TMPDIR}
cat /$TMPDIR/directional_facilities.csv | ${PSQL} -a -c "COPY network_equipment.directional_facilities FROM STDIN DELIMITER ',' CSV HEADER ENCODING 'Latin1';"
