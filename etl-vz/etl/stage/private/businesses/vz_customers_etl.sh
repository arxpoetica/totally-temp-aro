#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Specify states to load and target schema
IFS=',' read -a STATE_ARRAY <<< "${STATE_CODES}"
TARGET_SCHEMA_NAME='businesses'

cd $GISROOT;

for STATE in "${STATE_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/businesses/vz_customers_${STATE}.zip $GISROOT/vz_customers_${STATE}.zip
	$UNZIPTOOL vz_customers_${STATE}.zip -d ${TMPDIR}
	${PSQL} -a -c "SELECT create_vz_customers_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	cat /$TMPDIR/vz_customers_${STATE}.csv | ${PSQL} -a -c "COPY ${TARGET_SCHEMA_NAME}.vz_customers_${STATE} FROM STDIN DELIMITER ',' CSV HEADER;"
done
