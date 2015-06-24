#!/bin/bash

# 1. Load the raw data from TIGER COUSUB into the schema.
# 2. Reduce the raw TIGER COUSUB data into aro_cousub table format.
#
# GENERAL ASSUMPTIONS/HACKS: DON'T HARDCODE ALL OF THIS STUFF.
# For now, we're just downloading one state for the base development environment.

# TODO: Add a configuration task to create this folder and make world-writeable, also mount to alternate volume if not running locally
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

cd $GISROOT;
wget ftp://ftp2.census.gov/geo/tiger/TIGER2014/COUSUB/tl_2014_${STATEFIPS}_cousub.zip --accept=zip --reject=html -nd -nc
unzip tl_2014_${STATEFIPS}_cousub.zip -d ${TMPDIR}
cd $TMPDIR;

# Create table in tiger_data schema
${PSQL} -c "CREATE TABLE tiger_data.${STATECODE}_cousub(CONSTRAINT pk_${STATECODE}_cousub PRIMARY KEY (cosbidfp), CONSTRAINT uidx_${STATECODE}_cousub_gid UNIQUE (gid)) INHERITS(cousub);" 
# Load the table for the raw data into the tiger_staging schema
${SHP2PGSQL} -c -s 4269 -g the_geom -W "latin1" tl_2014_${STATEFIPS}_cousub.dbf tiger_staging.${STATECODE}_cousub | psql
# Transform and load into tiger_data schema, then add constraints and indexes
${PSQL} -c "ALTER TABLE tiger_staging.${STATECODE}_cousub RENAME geoid TO cosbidfp;"
${PSQL} -c "SELECT loader_load_staged_data(lower('${STATECODE}_cousub'), lower('${STATECODE}_cousub'));"
${PSQL} -c "ALTER TABLE tiger_data.${STATECODE}_cousub ADD CONSTRAINT chk_statefp CHECK (statefp = '${STATEFIPS}');"
${PSQL} -c "CREATE INDEX tiger_data_${STATECODE}_cousub_the_geom_gist ON tiger_data.${STATECODE}_cousub USING gist(the_geom);"
${PSQL} -c "CREATE INDEX idx_tiger_data_${STATECODE}_cousub_countyfp ON tiger_data.${STATECODE}_cousub USING btree(countyfp);"
