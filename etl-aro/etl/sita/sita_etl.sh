#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd $GISROOT;
rm -f ${TMPDIR}/*.*
wget https://s3.amazonaws.com/public.aro/sita/seattle_towers.csv.zip -nd -nc
unzip seattle_towers.csv.zip -d ${TMPDIR}

# Create and load sita_towers table
${PSQL} -a -f $DIR/create_sita_towers.sql

# Remove the header from the text file, since you can't ignore a header in the COPY command
# TODO: make this (all) able to apply to multiple files

# Create and load vz seattle table
${PSQL} -a -f $DIR/create_vz_wa_towers.sql

cat /$TMPDIR/seattle_towers.csv | ${PSQL} -a -c "COPY sita.vz_wa_towers FROM STDIN DELIMITER ',' CSV HEADER ENCODING 'Latin1';"

# Create and load vz columbus table
${PSQL} -a -f $DIR/create_vz_oh_towers.sql



