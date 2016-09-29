#!/bin/bash
set -e;


GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql

# Set array of states and FIPS codes to iterate through
declare -A STATE_FIPS_ARRAY=( [FL]=12 [IL]=17 [MO]=29 [WA]=53 )

for STATE in "${!STATE_FIPS_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	${PSQL} -c "DROP SCHEMA IF EXISTS tiger_staging CASCADE;"
	${PSQL} -c "CREATE SCHEMA tiger_staging;"

	# Download all blocks
	cd $GISROOT;
	
	wget ftp://ftp2.census.gov/geo/tiger/TIGER2014/TABBLOCK/tl_2014_${STATE_FIPS_ARRAY[$STATE]}* --accept=zip --reject=html -nd -nc
	for z in tl_*_${STATE_FIPS_ARRAY[$STATE]}*_tabblock10.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done
	for z in */tl_*_${STATE_FIPS_ARRAY[$STATE]}*_tabblock10.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done  #unsure what, if anything, this does
	cd $TMPDIR;

	# Create table from parent tabblock table
	${PSQL} -c "CREATE TABLE tiger_data.${STATE}_tabblock(CONSTRAINT pk_${STATE}_tabblock PRIMARY KEY (tabblock_id)) INHERITS(tiger.tabblock);" 

	${SHP2PGSQL}  -D -s 4269 -g the_geom -W "latin1" tl_2014_${STATE_FIPS_ARRAY[$STATE]}_tabblock10.dbf tiger_staging.${STATE}_tabblock | ${PSQL} 
	${PSQL} -c "ALTER TABLE tiger_staging.${STATE}_tabblock DROP uatyp10;"
	# ${PSQL} -c "ALTER TABLE tiger_data.${STATE}_tabblock RENAME geoid TO tabblock_id;"
	${PSQL} -c "SELECT loader_load_staged_data(lower('${STATE}_tabblock'), lower('${STATE}_tabblock'));"

	# Modify table and add constraints/indexes
	
	${PSQL} -c "ALTER TABLE tiger_data.${STATE}_tabblock ADD CONSTRAINT chk_statefp CHECK (statefp = '${STATE_FIPS_ARRAY[$STATE]}');"
	${PSQL} -c "CREATE INDEX tiger_data_${STATE}_tabblock_the_geom_gist ON tiger_data.${STATE}_tabblock USING gist(the_geom);"
	${PSQL} -c "vacuum analyze tiger_data.${STATE}_tabblock;"
done