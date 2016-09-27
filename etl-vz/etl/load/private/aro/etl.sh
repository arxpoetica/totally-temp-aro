#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

IFS=',' read -a STATE_ARRAY <<< "${STATE_CODES}"


#Load edges
declare STATE_CODE ;

for STATE in "${STATE_ARRAY[@]}"
do	
	state_code_lookup STATE_CODE $STATE
	${PSQL} -a -c "SELECT aro.create_shard_edge('${STATE}', '$STATE_CODE');"	
	${PSQL} -a -c "SELECT aro.load_shard_edge('${STATE}', '$STATE_CODE');"		
done

${PSQL} -a -f $DIR/load_cosub.sql

${PSQL} -a -f $DIR/load_census_blocks.sql

${PSQL} -a -f $DIR/load_cities.sql

${PSQL} -a -c "ANALYZE aro.edges;"

${PSQL} -a -c "ANALYZE aro.census_blocks;"

