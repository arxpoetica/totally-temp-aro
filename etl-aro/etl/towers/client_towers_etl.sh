#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Create and load vz seattle table
${PSQL} -a -f $DIR/create_vz_wa_towers.sql

# Create and load vz columbus table
${PSQL} -a -f $DIR/create_vz_oh_towers.sql

# file_name:table_name
# Assumes files end in .csv
declare -A TOWER_DATA_FILES=( [towers_seattle_wa]=vz_wa_towers [towers_columbus_oh]=vz_oh_towers )

cd $GISROOT;

for TOWER_DATA_FILE in "${!TOWER_DATA_FILES[@]}"
do
	wget https://s3.amazonaws.com/public.aro/towers/${TOWER_DATA_FILE}.csv -nd -nc
	cat /$GISROOT/${TOWER_DATA_FILE}.csv | ${PSQL} -a -c "COPY towers.${TOWER_DATA_FILES[$TOWER_DATA_FILE]} FROM STDIN DELIMITER ',' CSV HEADER ENCODING 'Latin1';"
	rm ${TOWER_DATA_FILE}.csv
done



