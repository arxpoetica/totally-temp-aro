#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1


DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd $GISROOT;
IFS=',' read -a SHP_STATE_ARRAY <<< "${SHP_FIBER_CODES}"
IFS=',' read -a KML_STATE_ARRAY <<< "${KML_FIBER_CODES}"

# Some fiber came as SHP, this section handles SHP
shp_state_array_len=${#SHP_STATE_ARRAY[@]}

# If there is only one state, download the file and create the table
if [ ${shp_state_array_len} == 1 ]; then
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/network_equipment/ves_fiber_${SHP_STATE_ARRAY[0]}.zip $GISROOT/ves_fiber_${SHP_STATE_ARRAY[0]}.zip
	$UNZIPTOOL ves_fiber_${SHP_STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/ves_fiber_${SHP_STATE_ARRAY[0]}.dbf network_equipment.shp_ves_fiber | ${PSQL}
# If there are two or more states, download the first file, create the table, then loop through the rest and append
elif [ ${shp_state_array_len} > 1 ]; then
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/network_equipment/ves_fiber_${SHP_STATE_ARRAY[0]}.zip $GISROOT/ves_fiber_${SHP_STATE_ARRAY[0]}.zip
	$UNZIPTOOL ves_fiber_${SHP_STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/ves_fiber_${SHP_STATE_ARRAY[0]}.dbf network_equipment.shp_ves_fiber | ${PSQL}

	for ((i=1; i<$shp_state_array_len; i++ ));
	do
		rm -f ${TMPDIR}/*.*
		aws s3 cp s3://public.aro/proto/network_equipment/ves_fiber_${SHP_STATE_ARRAY[i]}.zip $GISROOT/ves_fiber_${SHP_STATE_ARRAY[i]}.zip
		$UNZIPTOOL ves_fiber_${SHP_STATE_ARRAY[i]}.zip -d ${TMPDIR}
		${SHP2PGSQL} -a -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/ves_fiber_${SHP_STATE_ARRAY[i]}.dbf network_equipment.shp_ves_fiber | ${PSQL}
	done
fi

# Handle fiber from KML (converted to SHP but with different columns than above)
kml_state_array_len=${#KML_STATE_ARRAY[@]}

if [ ${kml_state_array_len} == 1 ]; then
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/network_equipment/kml_ves_fiber_${KML_STATE_ARRAY[0]}.zip $GISROOT/kml_ves_fiber_${KML_STATE_ARRAY[0]}.zip
	$UNZIPTOOL kml_ves_fiber_${KML_STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/kml_ves_fiber_${KML_STATE_ARRAY[0]}.dbf network_equipment.kml_ves_fiber | ${PSQL}
# If there are two or more states, download the first file, create the table, then loop through the rest and append
elif [ ${kml_state_array_len} > 1 ]; then
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/network_equipment/kml_ves_fiber_${KML_STATE_ARRAY[0]}.zip $GISROOT/kml_ves_fiber_${KML_STATE_ARRAY[0]}.zip
	$UNZIPTOOL kml_ves_fiber_${KML_STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/kml_ves_fiber_${KML_STATE_ARRAY[0]}.dbf network_equipment.kml_ves_fiber | ${PSQL}

	for ((i=1; i<$kml_state_array_len; i++ ));
	do
		rm -f ${TMPDIR}/*.*
		aws s3 cp s3://public.aro/proto/network_equipment/kml_ves_fiber_${KML_STATE_ARRAY[i]}.zip $GISROOT/kml_ves_fiber_${KML_STATE_ARRAY[i]}.zip
		$UNZIPTOOL kml_ves_fiber_${KML_STATE_ARRAY[i]}.zip -d ${TMPDIR}
		${SHP2PGSQL} -a -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/kml_ves_fiber_${KML_STATE_ARRAY[i]}.dbf network_equipment.kml_ves_fiber | ${PSQL}
	done
fi

# Merge both fiber types into one table
${PSQL} -a -f $DIR/create_fiber.sql



