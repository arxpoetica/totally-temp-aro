#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_vz_customers.sql

cd $GISROOT;

rm -f ${TMPDIR}/*.*
aws s3 cp s3://public.aro/proto/businesses/vz_customers.zip $GISROOT/vz_customers.zip
$UNZIPTOOL vz_customers.zip -d ${TMPDIR}
cat /$TMPDIR/vz_customers.csv | ${PSQL} -a -c "COPY businesses.vz_customers FROM STDIN DELIMITER ',' CSV HEADER;"
