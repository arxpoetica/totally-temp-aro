#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

##################
# CLIENT TOWERS
##################

# Create and load vz seattle, wa table
${PSQL} -a -f $DIR/create_vz_wa_towers.sql

# Create and load vz columbus, oh table
${PSQL} -a -f $DIR/create_vz_oh_towers.sql

# Create and load vz st. louis, mo table
${PSQL} -a -f $DIR/create_vz_mo_towers.sql

# Create and load vz madison, wi table
${PSQL} -a -f $DIR/create_vz_wi_towers.sql

# Create and load vz madison, wi table
${PSQL} -a -f $DIR/create_vz_il_towers.sql

# file_name:table_name
# Assumes files end in .csv
IFS=',' read -a TOWER_DATA_FILES <<< "${TOWER_CODES}"
declare TOWER_TABLE;

cd $GISROOT;

for TOWER_DATA_FILE in "${TOWER_DATA_FILES[@]}"
do
	TOWER_TABLE=tower_code_lookup TOWER_TABLE $TOWER_DATA_FILE
	aws s3 cp s3://public.aro/towers/${TOWER_DATA_FILE}.csv $GISROOT/${TOWER_DATA_FILE}.csv
	cat /$GISROOT/${TOWER_DATA_FILE}.csv | ${PSQL} -a -c "COPY towers.${TOWER_TABLE} FROM STDIN DELIMITER ',' CSV HEADER ENCODING 'Latin1';"
done

# Merge towers into single source table
${PSQL} -a -f $DIR/create_towers.sql