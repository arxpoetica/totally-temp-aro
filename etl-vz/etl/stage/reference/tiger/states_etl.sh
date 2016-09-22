#!/bin/bash

GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

rm -f ${TMPDIR}/*.*

cd $GISROOT;
wget ftp://ftp2.census.gov/geo/tiger/TIGER2014/STATE/tl_2014_us_state.zip --accept=zip --reject=html -nd -nc
${UNZIPTOOL} tl_2014_us_state.zip -d ${TMPDIR}
cd $TMPDIR;
${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" tl_2014_us_state.dbf tiger_data.state | ${PSQL}

${PSQL} -a -f $DIR/optimize_state.sql
