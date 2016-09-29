#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_vz_ves_lit.sql

declare -a STATE_ARRAY=( 'mo' 'wa' )

cd $GISROOT;

for STATE in "${STATE_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/businesses/ves_lit_${STATE}.zip $GISROOT/ves_lit_${STATE}.zip
	$UNZIPTOOL ves_lit_${STATE}.zip -d ${TMPDIR}
	cat /$TMPDIR/ves_lit_${STATE}.csv | ${PSQL} -a -c "COPY businesses.ves_lit FROM STDIN DELIMITER ',' CSV HEADER;"
done