#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_temp_hhs.sql

# Get infousa-households source file from S3
cd $GISROOT;
rm -f ${TMPDIR}/*.*
wget https://s3.amazonaws.com/public.aro/infousa/ny_households.zip -nd -nc
unzip ny_households.zip -d ${TMPDIR}

# Placing this CSV file here because eventually this should download from S3 and get deleted after it loads into the db
${PSQL} -a -c "COPY temp_hh.households (address, city, state, zip5, lat, lon, geog) FROM STDIN DELIMITER ',' CSV HEADER;" </$TMPDIR/ny_housholds.csv

${PSQL} -a -f $DIR/optimize_temp_hh.sql


