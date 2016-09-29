#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_vz_customers.sql

# Use lower case state names. FIPS codes unnecessary here as well.
declare -a STATE_ARRAY=( 'mo' 'wa' )

cd $GISROOT;

for STATE in "${STATE_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/businesses/customers_${STATE}.zip $GISROOT/customers_${STATE}.zip
	$UNZIPTOOL customers_${STATE}.zip -d ${TMPDIR}
	cat /$TMPDIR/customers_${STATE}.csv | ${PSQL} -a -c "COPY businesses.vz_customers FROM STDIN DELIMITER ',' CSV HEADER;"
done