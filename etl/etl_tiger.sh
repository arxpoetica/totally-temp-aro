#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

GISROOT=$ARO_DATA_ROOT/tiger
TMPDIR=/tmp/arotmp
UNZIPTOOL=unzip
SHP2PGSQL=${PGBIN}/shp2pgsql

mkdir -p $TMPDIR

${PSQL} -c "DROP EXTENSION IF EXISTS postgis_tiger_geocoder CASCADE;"
${PSQL} -c "DROP SCHEMA IF EXISTS tiger_data CASCADE;"
${PSQL} -c "DROP SCHEMA IF EXISTS tiger_staging CASCADE;"
${PSQL} -c "DROP SCHEMA IF EXISTS tiger CASCADE;"
${PSQL} -c "CREATE EXTENSION postgis_tiger_geocoder;"
${PSQL} -c "ALTER SCHEMA tiger OWNER TO aro;"
${PSQL} -c "ALTER SCHEMA tiger_data OWNER TO aro;"
${PSQL} -c "ALTER TABLE tiger.cousub OWNER TO aro;"
${PSQL} -c "ALTER TABLE tiger.edges OWNER TO aro;"
${PSQL} -c "ALTER TABLE tiger.tabblock OWNER TO aro;"


# Set array of states and FIPS codes to iterate through
declare -A STATE_FIPS_ARRAY=( [WA]=53 [NY]=36 )


for STATE in "${!STATE_FIPS_ARRAY[@]}"
do

    cd $GISROOT;
    rm -f ${TMPDIR}/*.*
    ${PSQL} -c "DROP SCHEMA IF EXISTS tiger_staging CASCADE;"
    ${PSQL} -c "CREATE SCHEMA tiger_staging;"

    ## CENSUS BLOCKS

    # Uncompress all zipfiles
    for z in tl_*_${STATE_FIPS_ARRAY[$STATE]}*_tabblock10.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done
    for z in */tl_*_${STATE_FIPS_ARRAY[$STATE]}*_tabblock10.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done  #unsure what, if anything, this does
    cd $TMPDIR;

    # Create table from parent tabblock table
    ${PSQL} -c "CREATE TABLE tiger_data.${STATE}_tabblock(CONSTRAINT pk_${STATE}_tabblock PRIMARY KEY (tabblock_id)) INHERITS(tiger.tabblock);" 
    # Stage shapefile and load
    ${SHP2PGSQL}  -D -s 4269 -g the_geom -W "latin1" tl_2014_${STATE_FIPS_ARRAY[$STATE]}_tabblock10.dbf tiger_staging.${STATE}_tabblock | ${PSQL} 
    ${PSQL} -c "ALTER TABLE tiger_staging.${STATE}_tabblock DROP uatyp10;"
    ${PSQL} -c "SELECT loader_load_staged_data(lower('${STATE}_tabblock'), lower('${STATE}_tabblock'));"
    # Modify table and add constraints/indexes
    ${PSQL} -c "ALTER TABLE tiger_data.${STATE}_tabblock ADD CONSTRAINT chk_statefp CHECK (statefp = '${STATE_FIPS_ARRAY[$STATE]}');"
    ${PSQL} -c "CREATE INDEX tiger_data_${STATE}_tabblock_the_geom_gist ON tiger_data.${STATE}_tabblock USING gist(the_geom);"
    ${PSQL} -c "vacuum analyze tiger_data.${STATE}_tabblock;"

    cd $GISROOT;
    rm -f ${TMPDIR}/*.*
    ${PSQL} -c "DROP SCHEMA IF EXISTS tiger_staging CASCADE;"
    ${PSQL} -c "CREATE SCHEMA tiger_staging;"

    ## COUNTY SUBDIVISIONS

    for z in tl_*_${STATE_FIPS_ARRAY[$STATE]}*_cousub.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done
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

    cd $GISROOT;
    rm -f ${TMPDIR}/*.*
    ${PSQL} -c "DROP SCHEMA IF EXISTS tiger_staging CASCADE;"
    ${PSQL} -c "CREATE SCHEMA tiger_staging;"

    ## EDGES

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
