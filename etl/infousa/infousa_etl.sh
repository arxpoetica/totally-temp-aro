#!/bin/bash

export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Get infousa source file from S3
cd $GISROOT;
rm -f ${TMPDIR}/*.*
wget https://s3.amazonaws.com/public.aro/infousa/infousa_ny.zip -nd -nc
unzip infousa_ny.zip -d ${TMPDIR}
cd $TMPDIR;
# Create and load infousa_businesses table
${PSQL} -a -f $DIR/create_infousa_businesses.sql

# TOTO: remove hard-coded path and find a better way of loading this data
cat /$TMPDIR/infousa_ny.csv | ${PSQL} -a -c "COPY infousa.businesses FROM STDIN DELIMITER ',' CSV HEADER;"

# Optimize buisnesses table
${PSQL} -a -f $DIR/optimize_infousa_businesses.sql