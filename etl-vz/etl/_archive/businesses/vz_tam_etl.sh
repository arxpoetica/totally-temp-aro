#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

# Cleaning command for new file:
# cat 20160727_TAM_with_SITEDUNS_WA.txt | tr -d , | tr '\t' ',' | tr '+' '0' | tr '?' '0' > tam_wa.csv

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_vz_tam.sql

declare -a STATE_ARRAY=( 'fl_1_1' 'fl_1_2' 'fl_2_1' 'fl_2_2' 'fl_3_1' 'fl_3_2' 'il_1_clean' 'il_2_clean' 'il_3_clean' 'mo' 'wa_1' 'wa_2' )

cd $GISROOT;

# Current TAM lists
for STATE in "${STATE_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/businesses/tam_${STATE}.zip $GISROOT/tam_${STATE}.zip
	$UNZIPTOOL tam_${STATE}.zip -d ${TMPDIR}
	cat /$TMPDIR/tam_${STATE}.csv | ${PSQL} -a -c "COPY businesses.tam FROM STDIN DELIMITER ',' CSV HEADER;"
done