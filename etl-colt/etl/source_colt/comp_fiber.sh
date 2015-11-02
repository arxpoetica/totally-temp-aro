#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd $DIR/local_data/competitor_fiber

$PSQL -a -c "DROP TABLE IF EXISTS source_colt.competitor_fiber_interroute_frankfurt;"
$PSQL -a -c "DROP TABLE IF EXISTS source_colt.competitor_fiber_level3_frankfurt;"

rm -rf interroute_frankfurt
rm -rf level3_frankfurt

ogr2ogr -f "ESRI Shapefile" ./interroute_frankfurt Fiber_Interroute_Frankfurt.kmz
${SHP2PGSQL} -c -s 4326 './interroute_frankfurt/Fiber_Interroute_Frankfurt.dbf' source_colt.competitor_fiber_interroute_frankfurt | ${PSQL}

ogr2ogr -f "ESRI Shapefile" ./level3_frankfurt Fiber_Level3_Frankfurt.kmz
${SHP2PGSQL} -c -s 4326 './level3_frankfurt/Fiber_Level3_Frankfurt.dbf' source_colt.competitor_fiber_level3_frankfurt | ${PSQL}
