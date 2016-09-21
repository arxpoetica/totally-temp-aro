#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

#${PSQL} -a -f $DIR/load_households.sql

#${PSQL} -a -f $DIR/load_towers.sql

# Below for loading TAM and Customer data only. 
#declare -a STATE_ARRAY=( 'fl' 'il' 'mo' 'wa' 'wi' )
IFS=',' read -a STATE_ARRAY <<< "${STATE_CODES}"

TARGET_SCHEMA_NAME='aro_location_data'
INFOUSA_SCOPED_SOURCE_TABLE='ref_businesses.infousa_businesses'
# TODO: add households
# TODO: maybe add towers

#declare UPPER_CASE_STATE ;

for STATE in "${STATE_ARRAY[@]}"
do

	#TODO Set ensure correct case
	#UPPER_CASE_STATE = ${STATE^^};

	${PSQL} -a -c "SELECT aro.create_locations_shard_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "SELECT aro.create_businesses_shard_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "SELECT aro.load_shard_infousa_businesses('${INFOUSA_SCOPED_SOURCE_TABLE}_${STATE}', '${TARGET_SCHEMA_NAME}', '${STATE}');"
done


# Industries, households, and towers do not load into paritions yet
${PSQL} -a -f $DIR/load_industries.sql



