#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from


# Force Functoins to reload data
# Create the functions to load partitioned businesses
${PSQL} -a -f $DIR/load_businesses.sql

# Create the functions to load partitioned towers
${PSQL} -a -f $DIR/load_towers.sql

# Create the functions to load partitioned locations
${PSQL} -a -f $DIR/load_locations.sql

# Create the functions to update industry codes
#${PSQL} -a -f $DIR/load_industries.sql

##

# Below for loading TAM and Customer data only. 
#declare -a STATE_ARRAY=( 'fl' 'il' 'mo' 'wa' 'wi' )
IFS=',' read -a STATE_ARRAY <<< "${STATE_CODES}"

TARGET_SCHEMA_NAME='aro_location_data'
INFOUSA_SCOPED_SOURCE_TABLE='ref_businesses.infousa_businesses'
TOWERS_SCOPED_SOURCE_TABLE='ref_towers.sita_towers'
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
	#${PSQL} -a -c "SELECT aro.update_shard_industries('${INFOUSA_SCOPED_SOURCE_TABLE}_${STATE}', '${STATE}');"

	# Fix problem where having NULL instead of 0 in costs columns causes issues.
	${PSQL} -a -c "UPDATE aro.businesses SET monthly_recurring_cost = 0 WHERE monthly_recurring_cost IS NULL;"
	${PSQL} -a -c "UPDATE aro.businesses SET annual_recurring_cost = 0 WHERE annual_recurring_cost IS NULL;"

	${PSQL} -a -c "SELECT aro.create_towers_shard_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "SELECT aro.load_shard_towers('${TOWERS_SCOPED_SOURCE_TABLE}', '${TARGET_SCHEMA_NAME}', '${STATE}');"
	
done




