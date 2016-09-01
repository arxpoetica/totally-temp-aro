#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_temp_hhs.sql

# Use lower case state names. FIPS codes unnecessary here as well.
declare -a STATE_ARRAY=( 'ny' 'wa' )

cd $GISROOT;

for STATE in "${STATE_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/infousa/households_${STATE}.zip $GISROOT/households_${STATE}.zip
	$UNZIPTOOL households_${STATE}.zip -d ${TMPDIR}
	${PSQL} -a -c "COPY temp_hh_data.households_${STATE} (address, city, state, zip5, lon, lat, geog) FROM STDIN DELIMITER ',' CSV HEADER;" </$TMPDIR/households_${STATE}.csv
done

${PSQL} -a -f $DIR/optimize_temp_hh.sql


