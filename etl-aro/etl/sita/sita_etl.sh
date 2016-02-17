#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

if [ ! -f "${GISROOT}/SITA_DATA_TOWER_13MAR10.zip"];
    then aws s3 cp s3://public.aro/sita/SITA_DATA_TOWER_13MAR10.zip $GISROOT/SITA_DATA_TOWER_13MAR10.zip;
fi

cd $GISROOT;
rm -f ${TMPDIR}/*.*

for z in SITA_*.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done
cd $TMPDIR;

# Create and load sita_towers table
${PSQL} -a -f $DIR/create_sita_towers.sql

# Remove the header from the text file, since you can't ignore a header in the COPY command
# TODO: make this (all) able to apply to multiple files
tail -n +2 /$TMPDIR/SITA_DATA_TOWER_13MAR10.txt > /$TMPDIR/sita_towers.txt

cat /$TMPDIR/sita_towers.txt | ${PSQL} -a -c "COPY sita.towers FROM stdin WITH (DELIMITER E'\t', ENCODING 'Latin1', NULL '""');"