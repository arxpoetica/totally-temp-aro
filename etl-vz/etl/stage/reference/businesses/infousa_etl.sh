#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_infousa_businesses.sql

# Use lower case state names. FIPS codes unnecessary here as well.
declare -a STATE_ARRAY=( 'ny' )

cd $GISROOT;

for STATE in "${STATE_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/infousa/businesses_${STATE}.zip $GISROOT/businesses_${STATE}.zip
	$UNZIPTOOL businesses_${STATE}.zip -d ${TMPDIR}
	cat /$TMPDIR/businesses_${STATE}.csv | ${PSQL} -a -c "COPY ref_businesses_data.infousa_${STATE} FROM STDIN DELIMITER ',' CSV HEADER;"
done

# Optimize buisnesses table
${PSQL} -a -f $DIR/optimize_infousa_businesses.sql