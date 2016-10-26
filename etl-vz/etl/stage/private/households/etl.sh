#!/bin/bash

# runs the ETL processes for households ETL

set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Use lower case state names. FIPS codes unnecessary here as well.
IFS=',' read -a STATE_ARRAY <<< "${STATE_CODES}"
TARGET_SCHEMA_NAME='households'

cd $GISROOT;

for STATE in "${STATE_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*

	if [ ! -f $GISROOT/households_${STATE}.zip ]; then
		aws s3 cp s3://public.aro/infousa/households_${STATE}.zip $GISROOT/households_${STATE}.zip
	fi

	$UNZIPTOOL households_${STATE}.zip -d ${TMPDIR}
	${PSQL} -a -c "SELECT households.create_households_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "COPY ${TARGET_SCHEMA_NAME}.vz_households_${STATE} (address, city, state, zipcode, lat, lon, address_id, income_level, education_level, credit_quality) FROM STDIN DELIMITER ',' CSV HEADER;" </$TMPDIR/households_${STATE}.csv
	${PSQL} -a -c "SELECT households.create_households_indexes('${STATE}', '${TARGET_SCHEMA_NAME}');"
done


