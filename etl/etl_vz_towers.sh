#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

GISROOT=$ARO_DATA_ROOT/vz_towers
TMPDIR=/tmp/arotmp
UNZIPTOOL=unzip
SHP2PGSQL=${PGBIN}/shp2pgsql
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

mkdir -p $TMPDIR

${PSQL} -c "DROP SCHEMA IF EXISTS vz_towers CASCADE;"
${PSQL} -c "CREATE SCHEMA vz_towers;"

# Create and load vz seattle table
${PSQL} -a -f $DIR/sql/create_vz_wa_towers.sql

# Create and load vz columbus table
${PSQL} -a -f $DIR/sql/create_vz_oh_towers.sql

# file_name:table_name
# Assumes files end in .csv
declare -A TOWER_DATA_FILES=( [towers_seattle_wa]=vz_wa_towers [towers_columbus_oh]=vz_oh_towers )

cd $GISROOT;

for TOWER_DATA_FILE in "${!TOWER_DATA_FILES[@]}"
do
    ${PSQL} -a -c "COPY vz_towers.${TOWER_DATA_FILES[$TOWER_DATA_FILE]} FROM STDIN DELIMITER ',' CSV HEADER ENCODING 'Latin1';" < /$GISROOT/${TOWER_DATA_FILE}.csv
done

