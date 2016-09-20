#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_nbm_blocks.sql

# Use upper case state names. FIPS codes unnecessary here as well.
IFS=',' read -a STATE_ARRAY <<< "${STATE_CODES}"

cd $GISROOT;
for STATE_CODE in "${STATE_ARRAY[@]}"
do
	STATE="${STATE_CODE,,}"
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/nbm/${STATE}-NBM-CBLOCK-CSV-JUN-2014.zip $GISROOT/${STATE}-NBM-CBLOCK-CSV-JUN-2014.zip
	$UNZIPTOOL -p ${STATE}-NBM-CBLOCK-CSV-JUN-2014.zip | ${PSQL} -a -c "COPY nbm.blocks FROM STDIN DELIMITER '|' CSV HEADER;" 
done

${PSQL} -a -f $DIR/optimize_nbm_blocks.sql
${PSQL} -a -f $DIR/competitor_speed_category.sql
${PSQL} -a -f $DIR/brand_strength.sql


