#!/bin/bash

PSQL=${PGBIN}/psql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Get demographic source file(s) from S3
cd $GISROOT;
rm -f ${TMPDIR}/*.*
wget https://s3.amazonaws.com/public.aro/demographics/households_ny.zip -nd -nc
unzip households_ny.zip -d ${TMPDIR}
cd $TMPDIR;
# Create and load households table
${PSQL} -a -f $DIR/create_households.sql

# TOTO: remove hard-coded path and find a better way of loading this data
cat /$TMPDIR/households_ny.csv | ${PSQL} -a -c "COPY demographics.households FROM STDIN DELIMITER ',' CSV HEADER;"

# Optimize households table
${PSQL} -a -f $DIR/optimize_demographics_households.sql