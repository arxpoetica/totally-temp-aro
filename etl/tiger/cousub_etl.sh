#!/bin/bash

# TODO: Set env variables via config so we don't need to set them in each ETL script
# TODO: Create a loop to run through all states/areas rather than copy-pasting the code

GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql
SHP2PGSQL=${PGBIN}/shp2pgsql

# Set array of states and FIPS codes to iterate through
declare -A STATE_FIPS_ARRAY=( [NY]=36 [OR]=41 [WA]=53 )
# declare -A state_array
# state_array[NY]=36
# state_array[WA]=53

# for state in "${!state_fips_array[@]}"
# do
#   echo "key  : $i"
#   echo "value: ${state_fips_array[$state]}"
# done

for STATE in "${!STATE_FIPS_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	${PSQL} -c "DROP SCHEMA IF EXISTS tiger_staging CASCADE;"
	${PSQL} -c "CREATE SCHEMA tiger_staging;"

	cd $GISROOT;
	wget ftp://ftp2.census.gov/geo/tiger/TIGER2014/COUSUB/tl_2014_${STATE_FIPS_ARRAY[$STATE]}_cousub.zip --accept=zip --reject=html -nd -nc
	unzip tl_2014_${STATE_FIPS_ARRAY[$STATE]}_cousub.zip -d ${TMPDIR}
	cd $TMPDIR;

	# Create table in tiger_data schema
	${PSQL} -c "CREATE TABLE tiger_data.${STATE}_cousub(CONSTRAINT pk_${STATE}_cousub PRIMARY KEY (cosbidfp), CONSTRAINT uidx_${STATE}_cousub_gid UNIQUE (gid)) INHERITS(tiger.cousub);" 
	# Load the table for the raw data into the tiger_staging schema
	${SHP2PGSQL} -c -s 4269 -g the_geom -W "latin1" tl_2014_${STATE_FIPS_ARRAY[$STATE]}_cousub.dbf tiger_staging.${STATE}_cousub | psql
	# Transform and load into tiger_data schema, then add constraints and indexes
	${PSQL} -c "ALTER TABLE tiger_staging.${STATE}_cousub RENAME geoid TO cosbidfp;"
	${PSQL} -c "SELECT loader_load_staged_data(lower('${STATE}_cousub'), lower('${STATE}_cousub'));"
	${PSQL} -c "ALTER TABLE tiger_data.${STATE}_cousub ADD CONSTRAINT chk_statefp CHECK (statefp = '${STATE_FIPS_ARRAY[$STATE]}');"
	${PSQL} -c "CREATE INDEX tiger_data_${STATE}_cousub_the_geom_gist ON tiger_data.${STATE}_cousub USING gist(the_geom);"
	${PSQL} -c "CREATE INDEX idx_tiger_data_${STATE}_cousub_countyfp ON tiger_data.${STATE}_cousub USING btree(countyfp);"
	${PSQL} -c "vacuum analyze tiger_data.${STATE}_cousub;"
done
