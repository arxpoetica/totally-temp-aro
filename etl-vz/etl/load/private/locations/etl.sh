#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

IFS=',' read -a STATE_ARRAY <<< "${STATE_CODES}"

TARGET_SCHEMA_NAME='aro_location_data'
TAM_SCOPED_SOURCE_TABLE='businesses.tam'
INFOUSA_SCOPED_SOURCE_TABLE='ref_businesses.infousa_businesses'
CUSTOMERS_SCOPED_SOURCE_TABLE='businesses.vz_customers'
TOWERS_SCOPED_SOURCE_TABLE='towers.towers_state'

for STATE in "${STATE_ARRAY[@]}"
do

	${PSQL} -a -c "SELECT aro.create_locations_shard_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "SELECT aro.create_businesses_shard_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	
	# Add this in after extracting industry to its own reference table
	# Industry should not depend on InfoUSA - get source from SIC
	# ${PSQL} -a -c "SELECT aro.update_shard_industries('${INFOUSA_SCOPED_SOURCE_TABLE}_${STATE}', '${STATE}');"

	${PSQL} -a -c "SELECT aro.load_shard_tam_businesses('${TAM_SCOPED_SOURCE_TABLE}_${STATE}', '${TARGET_SCHEMA_NAME}', '${STATE}');"
	${PSQL} -a -c "SELECT aro.load_shard_customer_businesses('${CUSTOMERS_SCOPED_SOURCE_TABLE}_${STATE}', '${TARGET_SCHEMA_NAME}', '${STATE}');"

	# Fix problem where having NULL instead of 0 in costs columns causes issues.
	${PSQL} -a -c "UPDATE aro.businesses SET monthly_recurring_cost = 0 WHERE monthly_recurring_cost IS NULL;"
	${PSQL} -a -c "UPDATE aro.businesses SET annual_recurring_cost = 0 WHERE annual_recurring_cost IS NULL;"

	${PSQL} -a -c "SELECT aro.create_tower_shard_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "SELECT aro.load_shard_tower('${TOWERS_SCOPED_SOURCE_TABLE}', '${TARGET_SCHEMA_NAME}', '${STATE}');"

	${PSQL} -a -c "SELECT aro.create_temp_households_shard_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "SELECT aro.load_shard_temp_households('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "SELECT aro.create_households_shard_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "SELECT aro.load_shard_households('${STATE}', '${TARGET_SCHEMA_NAME}');"
	${PSQL} -a -c "SELECT aro.drop_temp_households_shard('${STATE}', '${TARGET_SCHEMA_NAME}');"

done



${PSQL} -a -c "ANALYZE aro.locations;"
${PSQL} -a -c "ANALYZE aro.businesses;"
${PSQL} -a -c "ANALYZE aro.households;"
