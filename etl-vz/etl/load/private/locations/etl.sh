#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Industries, households, and towers do not load into paritions yet
${PSQL} -a -f $DIR/load_industries.sql

${PSQL} -a -f $DIR/load_households.sql

${PSQL} -a -f $DIR/load_towers.sql

# Below for loading TAM and Customer data only. 
declare -a STATE_ARRAY=( 'fl' 'il' 'mo' 'wa' 'wi' )

TARGET_SCHEMA_NAME='aro_location_data'
TAM_SCOPED_SOURCE_TABLE='businesses.tam'
CUSTOMERS_SCOPED_SOURCE_TABLE='businesses.vz_customers'
# TODO: add households
# TODO: maybe add towers

for STATE in "${STATE_ARRAY[@]}"
do
	${PSQL} -a -c "SELECT aro.create_locations_shard_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "SELECT aro.create_businesses_shard_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "SELECT aro.load_shard_tam_businesses('${TAM_SCOPED_SOURCE_TABLE}_${STATE}', '${TARGET_SCHEMA_NAME}', '${STATE}');"
	${PSQL} -a -c "SELECT aro.load_shard_customer_businesses('${CUSTOMERS_SCOPED_SOURCE_TABLE}_${STATE}', '${TARGET_SCHEMA_NAME}', '${STATE}');"
done


