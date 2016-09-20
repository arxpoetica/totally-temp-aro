#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

# Cleaning command for new file:
# cat 20160727_TAM_with_SITEDUNS_WA.txt | tr -d , | tr '\t' ',' | tr '+' '0' | tr '?' '0' > tam_wa.csv

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

declare -a STATE_ARRAY=( 'fl' 'il' 'mo' 'wa' 'wi' )
TARGET_SCHEMA_NAME='businesses'

cd $GISROOT;

# Current TAM lists
for STATE in "${STATE_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/businesses/tam_${STATE}.zip $GISROOT/tam_${STATE}.zip
	$UNZIPTOOL tam_${STATE}.zip -d ${TMPDIR}
	${PSQL} -a -c "SELECT create_vz_tam_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	cat /$TMPDIR/tam_${STATE}.csv | ${PSQL} -a -c "COPY ${TARGET_SCHEMA_NAME}.tam_${STATE} FROM STDIN DELIMITER ',' CSV HEADER;"
done