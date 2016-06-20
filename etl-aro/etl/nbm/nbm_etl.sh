#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_nbm_blocks.sql

# Replace with S3 step...
cd $GISROOT
cat /$GISROOT/NY-NBM-CBLOCK-CSV-JUN-2014.CSV | ${PSQL} -a -c "COPY nbm.blocks FROM STDIN DELIMITER '|' CSV HEADER;"

${PSQL} -a -f $DIR/optimize_nbm_blocks.sql
