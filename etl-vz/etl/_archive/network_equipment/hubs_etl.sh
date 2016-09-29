#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Need to create a destination table for the hubs provided from CSV files...
${PSQL} -a -f $DIR/create_csv_hubs.sql

cd $GISROOT;

# Seattle hubs are a shapefile, but we've been given multiple file types.
# This section handles the shapefile import
declare -a STATE_ARRAY=( 'wa' 'mo' )
state_array_len=${#STATE_ARRAY[@]}

# If there is only one state, download the file and create the table
if [ ${state_array_len} == 1 ]; then
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/network_equipment/hubs_${STATE_ARRAY[0]}.zip $GISROOT/hubs_${STATE_ARRAY[0]}.zip 
	$UNZIPTOOL hubs_${STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/hubs_${STATE_ARRAY[0]}.dbf network_equipment.hubs_shp | ${PSQL}
# If there are two or more states, download the first file, create the table, then loop through the rest and append
elif [ ${state_array_len} > 1 ]; then
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/network_equipment/hubs_${STATE_ARRAY[0]}.zip $GISROOT/hubs_${STATE_ARRAY[0]}.zip
	$UNZIPTOOL hubs_${STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/hubs_${STATE_ARRAY[0]}.dbf network_equipment.hubs_shp | ${PSQL}

	for ((i=1; i<$state_array_len; i++ ));
	do
		rm -f ${TMPDIR}/*.*
		aws s3 cp s3://public.aro/proto/network_equipment/hubs_${STATE_ARRAY[i]}.zip $GISROOT/hubs_${STATE_ARRAY[i]}.zip
		$UNZIPTOOL hubs_${STATE_ARRAY[i]}.zip -d ${TMPDIR}
		${SHP2PGSQL} -a -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/hubs_${STATE_ARRAY[i]}.dbf network_equipment.hubs_shp | ${PSQL}
	done
fi

# Some other hub data was given as CSV
# This section handles the CSV import
for ((i=0; i<$state_array_len; i++ ));
do
	aws s3 cp s3://public.aro/proto/network_equipment/hubs_${STATE_ARRAY[i]}.csv $GISROOT/hubs_${STATE_ARRAY[i]}.csv
	cat /$GISROOT/hubs_${STATE_ARRAY[i]}.csv | ${PSQL} -a -c "COPY network_equipment.hubs_csv FROM STDIN DELIMITER ',' CSV HEADER ENCODING 'Latin1';"
	rm /$GISROOT/hubs_${STATE_ARRAY[i]}.csv
done

# Table to dump all SHP and CSV hubs into after loading each source table
${PSQL} -a -f $DIR/create_hubs.sql