#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Placing this CSV file here because eventually this should download from S3 and get deleted after it loads into the db
# File is called 'ny_households.csv'
cd $TMPDIR

${PSQL} -a -f $DIR/create_temp_hhs.sql

cat /$TMPDIR/ny_households.csv | ${PSQL} -a -c "COPY temp_hh.households (address, city, state, zip5, lat, lon, geog) FROM STDIN DELIMITER ',' CSV HEADER;"

${PSQL} -a -f $DIR/optimize_temp_hh.sql


