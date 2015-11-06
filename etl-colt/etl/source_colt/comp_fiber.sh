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
$PSQL -a -c "DROP TABLE IF EXISTS source_colt.competitor_fiber_zayo;"
$PSQL -a -c "DROP TABLE IF EXISTS source_colt.competitor_fiber_versatel_frankfurt;"
$PSQL -a -c "DROP TABLE IF EXISTS source_colt.competitor_fiber_eunetworks_frankfurt;"
$PSQL -a -c "DROP TABLE IF EXISTS source_colt.competitor_fiber_eunetworks_paris;"
$PSQL -a -c "DROP TABLE IF EXISTS source_colt.competitor_fiber_bouygues_paris;"

# Interroute (Frankfurt and Paris)
ogr2ogr -f "ESRI Shapefile" ./interroute_frankfurt Fiber_Interroute_Frankfurt.kmz
${SHP2PGSQL} -c -s 4326 './interroute_frankfurt/Fiber_Interroute_Frankfurt.dbf' source_colt.competitor_fiber_interroute_frankfurt | ${PSQL}

ogr2ogr -f "ESRI Shapefile" ./interroute_paris Fiber_Interroute_Paris.kmz
${SHP2PGSQL} -c -s 4326 './interroute_paris/Fiber_Interroute_Paris.dbf' source_colt.competitor_fiber_interroute_paris | ${PSQL}

# Level 3 (Frankfurt and Paris)
ogr2ogr -f "ESRI Shapefile" ./level3_frankfurt Fiber_Level3_Frankfurt.kmz
${SHP2PGSQL} -c -s 4326 './level3_frankfurt/Fiber_Level3_Frankfurt.dbf' source_colt.competitor_fiber_level3_frankfurt | ${PSQL}

ogr2ogr -f "ESRI Shapefile" ./level3_paris Fiber_Level3_Paris.kmz
${SHP2PGSQL} -c -s 4326 './level3_paris/Fiber_Level3_Paris.dbf' source_colt.competitor_fiber_level3_paris | ${PSQL}

# Zayo (EU wide - no city specifications)
ogr2ogr -f "ESRI Shapefile" ./zayo ZAYO_UK-EU_NETWORK.kmz
${SHP2PGSQL} -c -s 4326 './zayo/UK-EU LEASED LONGHAUL NETWORK.dbf' source_colt.competitor_fiber_zayo | ${PSQL}

# Versatel (Frankfurt)
ogr2ogr -f "ESRI Shapefile" ./versatel_frankfurt Fiber_Versatel_Frankfurt.kmz
${SHP2PGSQL} -c -s 4326 './versatel_frankfurt/Fiber_Versatel_Frankfurt.dbf' source_colt.competitor_fiber_versatel_frankfurt | ${PSQL}

# EUNetworks (Frankfurt and Paris)
ogr2ogr -f "ESRI Shapefile" ./eunetworks_frankfurt Fiber_EUNetworks_Frankfurt.kmz
${SHP2PGSQL} -c -s 4326 './eunetworks_frankfurt/Fiber_EUNetworks_Frankfurt.dbf' source_colt.competitor_fiber_eunetworks_frankfurt | ${PSQL}

ogr2ogr -f "ESRI Shapefile" ./eunetworks_paris Fiber_EUNetworks_Paris.kmz
${SHP2PGSQL} -c -s 4326 './eunetworks_paris/Fiber_EUNetworks_Paris.dbf' source_colt.competitor_fiber_eunetworks_paris | ${PSQL}

# Bouygues (Paris)
ogr2ogr -f "ESRI Shapefile" ./bouygues bouygues.kml
${SHP2PGSQL} -c -s 4326 './bouygues/Bouygues_FixedNetwork bdys.dbf' source_colt.competitor_fiber_bouygues_paris | ${PSQL}

rm -rf interroute_frankfurt
rm -rf interroute_paris
rm -rf level3_frankfurt
rm -rf level3_paris
rm -rf zayo
rm -rf versatel_frankfurt
rm -rf eunetworks_frankfurt
rm -rf eunetworks_paris
rm -rf bouygues
