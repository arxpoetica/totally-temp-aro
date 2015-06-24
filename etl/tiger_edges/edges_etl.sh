#!/bin/bash

# 1. Load the raw data from TIGER EDGES into the schema.
# 2. Reduce the raw TIGER EDGES data into aro_edges table format.
# 3. Build aro_graph table using pgRouting
#
# GENERAL ASSUMPTIONS/HACKS: DON'T HARDCODE ALL OF THIS STUFF.
# For now, we're just downloading one county's worth of edges for the base development environment.

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

# We should download these to an S3 bucket when we load the rest of the country.



###############
# New York (36)
STATEFIPS=36
STATECODE=NY

rm -f ${TMPDIR}/*.*
${PSQL} -c "DROP SCHEMA IF EXISTS tiger_staging CASCADE;"
${PSQL} -c "CREATE SCHEMA tiger_staging;"

# Download all edges
cd $GISROOT;
# wget ftp://ftp2.census.gov/geo/tiger/TIGER2014/EDGES/tl_2014_${STATEFIPS}* --accept=zip --reject=html -nd -nc
# TODO: Remove this and uncomment previous line
wget ftp://ftp2.census.gov/geo/tiger/TIGER2014/EDGES/tl_2014_${STATEFIPS}047_edges.zip --accept=zip --reject=html -nd -nc
# Uncompress all zipfiles
for z in tl_*_${STATEFIPS}*_edges.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done
for z in */tl_*_${STATEFIPS}*_edges.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done  #unsure what, if anything, this does
cd $TMPDIR;

# Create table from parent edges table
${PSQL} -c "CREATE TABLE tiger_data.${STATECODE}_edges(CONSTRAINT pk_${STATECODE}_edges PRIMARY KEY (gid)) INHERITS(edges);" 

# Load shapefiles into staging schema
# for z in *edges.dbf; do 
# 	${SHP2PGSQL}  -D -s 4269 -g the_geom -W "latin1" $z tiger_staging.${STATECODE}_edges | ${PSQL} 
# 	${PSQL} -c "SELECT loader_load_staged_data(lower('${STATECODE}_edges'), lower('${STATECODE}_edges'));"
# done

# This will only load a single shapefile of edges, rather than the entire state
# TODO: Remove this and uncomment the previous block, which loads the entire state
${SHP2PGSQL}  -D -s 4269 -g the_geom -W "latin1" tl_2014_36047_edges.dbf tiger_staging.${STATECODE}_edges | ${PSQL} 
${PSQL} -c "SELECT loader_load_staged_data(lower('${STATECODE}_edges'), lower('${STATECODE}_edges'));"

# Modify table and add constraints/indexes
${PSQL} -c "ALTER TABLE tiger_data.${STATECODE}_edges ADD CONSTRAINT chk_statefp CHECK (statefp = '${STATEFIPS}');"
${PSQL} -c "CREATE INDEX idx_tiger_data_${STATECODE}_edges_tlid ON tiger_data.${STATECODE}_edges USING btree (tlid);"
${PSQL} -c "CREATE INDEX idx_tiger_data_${STATECODE}_edgestfidr ON tiger_data.${STATECODE}_edges USING btree (tfidr);"
${PSQL} -c "CREATE INDEX idx_tiger_data_${STATECODE}_edges_tfidl ON tiger_data.${STATECODE}_edges USING btree (tfidl);"
${PSQL} -c "CREATE INDEX idx_tiger_data_${STATECODE}_edges_countyfp ON tiger_data.${STATECODE}_edges USING btree (countyfp);"
${PSQL} -c "CREATE INDEX tiger_data_${STATECODE}_edges_the_geom_gist ON tiger_data.${STATECODE}_edges USING gist(the_geom);"
${PSQL} -c "CREATE INDEX idx_tiger_data_${STATECODE}_edges_zipl ON tiger_data.${STATECODE}_edges USING btree (zipl);"
${PSQL} -c "vacuum analyze tiger_data.${STATECODE}_edges;"
