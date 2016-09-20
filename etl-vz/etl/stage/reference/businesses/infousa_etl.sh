#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Use lower case state names. FIPS codes unnecessary here as well.
declare -a STATE_ARRAY=( 'ny' )
TARGET_SCHEMA_NAME='ref_businesses'

cd $GISROOT;

for STATE in "${STATE_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/infousa/businesses_${STATE}.zip $GISROOT/businesses_${STATE}.zip
	$UNZIPTOOL businesses_${STATE}.zip -d ${TMPDIR}
	${PSQL} -a -c "SELECT create_infousa_businesses_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	cat /$TMPDIR/businesses_${STATE}.csv | ${PSQL} -a -c "COPY ${TARGET_SCHEMA_NAME}.infousa_businesses_${STATE} FROM STDIN DELIMITER ',' CSV HEADER;"
	${PSQL} -a -c "SELECT create_infousa_businesses_indexes('${STATE}', '${TARGET_SCHEMA_NAME}');"
done