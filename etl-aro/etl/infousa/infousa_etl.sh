#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_infousa_businesses.sql

# Use lower case state names. FIPS codes unnecessary here as well.
declare -a STATE_ARRAY=( 'ny' 'wa' )

cd $GISROOT;

for STATE in "${STATE_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	wget https://s3.amazonaws.com/public.aro/infousa/businesses_${STATE}.zip -nd -nc
	$UNZIPTOOL businesses_${STATE}.zip -d ${TMPDIR}
	cat /$TMPDIR/businesses_${STATE}.csv | ${PSQL} -a -c "COPY infousa.businesses FROM STDIN DELIMITER ',' CSV HEADER;"
done

# Optimize buisnesses table
${PSQL} -a -f $DIR/optimize_infousa_businesses.sql