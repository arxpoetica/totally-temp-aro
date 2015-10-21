#!/bin/bash

GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql

# Set array of states and FIPS codes to iterate through
declare -A STATE_FIPS_ARRAY=( [NY]=36 )


for STATE in "${!STATE_FIPS_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*
	${PSQL} -c "DROP SCHEMA IF EXISTS tiger_staging CASCADE;"
	${PSQL} -c "CREATE SCHEMA tiger_staging;"

	# Download all edges
	cd $GISROOT;
	#wget ftp://ftp2.census.gov/geo/tiger/TIGER2014/EDGES/tl_2014_${STATE_FIPS_ARRAY[$STATE]}* --accept=zip --reject=html -nd -nc
	# New York County (i.e., Manhattan) (for upper east side wirecenter)
	wget ftp://ftp2.census.gov/geo/tiger/TIGER2014/EDGES/tl_2014_36061_edges.zip --accept=zip --reject=html -nd -nc
	# Erie County (for Buffalo, North Collins, and Orchard Park)
	wget ftp://ftp2.census.gov/geo/tiger/TIGER2014/EDGES/tl_2014_36029_edges.zip --accept=zip --reject=html -nd -nc
	# Uncompress all zipfiles
	for z in tl_*_${STATE_FIPS_ARRAY[$STATE]}*_edges.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done
	for z in */tl_*_${STATE_FIPS_ARRAY[$STATE]}*_edges.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done  #unsure what, if anything, this does
	cd $TMPDIR;

	# Create table from parent edges table
	${PSQL} -c "CREATE TABLE tiger_data.${STATE}_edges(CONSTRAINT pk_${STATE}_edges PRIMARY KEY (gid)) INHERITS(tiger.edges);" 

	# Load shapefiles into staging schema
	for z in *edges.dbf; do 
		${SHP2PGSQL}  -D -s 4269 -g the_geom -W "latin1" $z tiger_staging.${STATE}_edges | ${PSQL} 
		${PSQL} -c "SELECT loader_load_staged_data(lower('${STATE}_edges'), lower('${STATE}_edges'));"
	done

	# This will only load a single shapefile of edges, rather than the entire state
	# TODO: Remove this and uncomment the previous block, which loads the entire state
	# ${SHP2PGSQL}  -D -s 4269 -g the_geom -W "latin1" tl_2014_36061_edges.dbf tiger_staging.${STATE}_edges | ${PSQL} 
	# ${PSQL} -c "SELECT loader_load_staged_data(lower('${STATE}_edges'), lower('${STATE}_edges'));"

	# Modify table and add constraints/indexes
	${PSQL} -c "ALTER TABLE tiger_data.${STATE}_edges ADD CONSTRAINT chk_statefp CHECK (statefp = '${STATE_FIPS_ARRAY[$STATE]}');"
	${PSQL} -c "CREATE INDEX idx_tiger_data_${STATE}_edges_tlid ON tiger_data.${STATE}_edges USING btree (tlid);"
	${PSQL} -c "CREATE INDEX idx_tiger_data_${STATE}_edgestfidr ON tiger_data.${STATE}_edges USING btree (tfidr);"
	${PSQL} -c "CREATE INDEX idx_tiger_data_${STATE}_edges_tfidl ON tiger_data.${STATE}_edges USING btree (tfidl);"
	${PSQL} -c "CREATE INDEX idx_tiger_data_${STATE}_edges_countyfp ON tiger_data.${STATE}_edges USING btree (countyfp);"
	${PSQL} -c "CREATE INDEX tiger_data_${STATE}_edges_the_geom_gist ON tiger_data.${STATE}_edges USING gist(the_geom);"
	${PSQL} -c "CREATE INDEX idx_tiger_data_${STATE}_edges_zipl ON tiger_data.${STATE}_edges USING btree (zipl);"
	${PSQL} -c "vacuum analyze tiger_data.${STATE}_edges;"
done