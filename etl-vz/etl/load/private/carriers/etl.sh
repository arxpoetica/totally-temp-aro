#!/bin/bash
set -e;

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Use upper case state names. FIPS codes unnecessary here as well.
IFS=',' read -a STATE_ARRAY <<< "${STATE_CODES}"
CENSUS_BLOCK_TARGET_SCHEMA='client_carrier_data'
FIBER_TARGET_SCHEMA='aro_fiber_plant_data'

${PSQL} -a -f $DIR/load_carriers.sql

# Load census block (NBM) and (geotel) fiber carriers for each state
for STATE_CODE in "${STATE_ARRAY[@]}"
do
	STATE="${STATE_CODE^^}"
	# Census block carriers
	${PSQL} -a -c "SELECT client.create_census_block_carriers_partition('${STATE}', '${CENSUS_BLOCK_TARGET_SCHEMA}');"
	${PSQL} -a -c "SELECT client.load_census_block_carriers_partition('${STATE}', '${CENSUS_BLOCK_TARGET_SCHEMA}');"

	# Fiber carriers
	${PSQL} -a -c "SELECT aro.create_fiber_plant_partition('${STATE}', '${FIBER_TARGET_SCHEMA}');"
	${PSQL} -a -c "SELECT aro.load_fiber_plant_partition('${STATE}', '${FIBER_TARGET_SCHEMA}');"
done



