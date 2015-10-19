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


aws s3 cp --region us-east-1 s3://colt.aro/fiber.zip ./

for z in fiber*.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done
cd $TMPDIR;

# Create and load source_colt schema 
$PSQL -a -c "DROP SCHEMA IF EXISTS source_colt;"
$PSQL -a -c "CREATE SCHEMA source_colt;"

ogr2ogr -f "ESRI Shapefile" ./paris_fiber paris_fiber.kml -overwrite
ogr2ogr -f "ESRI Shapefile" ./frankfurt_fiber frankfurt_fiber.kml -overwrite

${SHP2PGSQL} -c -s 4326 './paris_fiber/Trench_active (d).dbf' source_colt.paris_fiber | ${PSQL}

${SHP2PGSQL} -c -s 4326 './frankfurt_fiber/Trench_active (d).dbf' source_colt.frankfurt_fiber | ${PSQL}