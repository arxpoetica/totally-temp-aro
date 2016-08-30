#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

##################
# SITA TOWERS
##################

${PSQL} -a -f $DIR/create_sita_towers.sql

cd $GISROOT;
rm -f ${TMPDIR}/*.*
aws s3 cp s3://public.aro/towers/SITA_DATA_TOWER_13MAR10.zip $GISROOT/SITA_DATA_TOWER_13MAR10.zip
$UNZIPTOOL SITA_DATA_TOWER_13MAR10.zip -d ${TMPDIR}

# Remove the header from the text file, since you can't ignore a header in the COPY command
tail -n +2 /$TMPDIR/SITA_DATA_TOWER_13MAR10.txt > /$TMPDIR/sita_towers.txt

cat /$TMPDIR/sita_towers.txt | ${PSQL} -a -c "COPY towers.sita_towers FROM stdin WITH (DELIMITER E'\t', ENCODING 'Latin1', NULL '""');"

rm /$TMPDIR/SITA_DATA_TOWER_13MAR10.txt
rm /$TMPDIR/sita_towers.txt

##################
# CLIENT TOWERS
##################

# Create and load vz seattle table
${PSQL} -a -f $DIR/create_vz_wa_towers.sql

# Create and load vz columbus table
${PSQL} -a -f $DIR/create_vz_oh_towers.sql

# Create and load vz st. louis table
${PSQL} -a -f $DIR/create_vz_mo_towers.sql

# file_name:table_name
# Assumes files end in .csv
declare -A TOWER_DATA_FILES=( [towers_seattle_wa]=vz_wa_towers [towers_columbus_oh]=vz_oh_towers [towers_mo]=vz_mo_towers )

cd $GISROOT;

for TOWER_DATA_FILE in "${!TOWER_DATA_FILES[@]}"
do
	aws s3 cp s3://public.aro/towers/${TOWER_DATA_FILE}.csv $GISROOT/${TOWER_DATA_FILE}.csv
	cat /$GISROOT/${TOWER_DATA_FILE}.csv | ${PSQL} -a -c "COPY towers.${TOWER_DATA_FILES[$TOWER_DATA_FILE]} FROM STDIN DELIMITER ',' CSV HEADER ENCODING 'Latin1';"
	rm ${TOWER_DATA_FILE}.csv
done

# Merge towers into single source table
${PSQL} -a -f $DIR/create_towers.sql