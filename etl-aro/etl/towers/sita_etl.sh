#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Create and load sita_towers table
${PSQL} -a -f $DIR/create_sita_towers.sql

cd $GISROOT;
rm -f ${TMPDIR}/*.*
wget https://s3://public.aro/towers/SITA_DATA_TOWER_13MAR10.zip -nd -nc
$UNZIPTOOL SITA_DATA_TOWER_13MAR10.zip -d ${TMPDIR}

# Remove the header from the text file, since you can't ignore a header in the COPY command
tail -n +2 /$TMPDIR/SITA_DATA_TOWER_13MAR10.txt > /$TMPDIR/sita_towers.txt

cat /$TMPDIR/sita_towers.txt | ${PSQL} -a -c "COPY towers.sita_towers FROM stdin WITH (DELIMITER E'\t', ENCODING 'Latin1', NULL '""');"

rm /$TMPDIR/SITA_DATA_TOWER_13MAR10.txt
rm /$TMPDIR/sita_towers.txt




