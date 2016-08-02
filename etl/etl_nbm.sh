#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

GISROOT=$ARO_DATA_ROOT/nbm
TMPDIR=/tmp/arotmp
UNZIPTOOL=unzip
SHP2PGSQL=${PGBIN}/shp2pgsql
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

mkdir -p $TMPDIR

${PSQL} -c "DROP SCHEMA IF EXISTS nbm CASCADE;"
${PSQL} -c "CREATE SCHEMA nbm;"


# Use lower case state names. FIPS codes unnecessary here as well.
${PSQL} -a -f $DIR/sql/create_nbm_blocks.sql

# Use upper case state names. FIPS codes unnecessary here as well.
declare -a STATE_ARRAY=( 'NY' 'WA' )

cd $GISROOT;
for STATE in "${STATE_ARRAY[@]}"
do
    rm -f ${TMPDIR}/*.*    
    $UNZIPTOOL -p ${STATE}-NBM-CBLOCK-CSV-JUN-2014.zip | ${PSQL} -a -c "COPY nbm.blocks FROM STDIN DELIMITER '|' CSV HEADER;" 
done

${PSQL} -a -f $DIR/sql/optimize_nbm_blocks.sql

${PSQL} -a -f $DIR/sql/create_nbm_aux_tables.sql
