#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_nbm_blocks.sql

# Replace with S3 step...
cd $GISROOT;
rm -f ${TMPDIR}/*.*
wget https://s3.amazonaws.com/public.aro/nbm/NY-NBM-CBLOCK-CSV-JUN-2014.zip -nd -nc
#unzip NY-NBM-CBLOCK-CSV-JUN-2014.zip -d ${TMPDIR}

unzip -p NY-NBM-CBLOCK-CSV-JUN-2014.zip | ${PSQL} -a -c "COPY nbm.blocks FROM STDIN DELIMITER '|' CSV HEADER;" 

${PSQL} -a -f $DIR/optimize_nbm_blocks.sql
