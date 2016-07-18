#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd $GISROOT;

# 1. Load Fiber 

declare -a FIBER_STATE_ARRAY=( 'ny' )
fiber_state_array_len=${#FIBER_STATE_ARRAY[@]}

# If there is only one state, download the file and create the table
if [ ${fiber_state_array_len} == 1 ]; then
	rm -f ${TMPDIR}/*.*
	wget https://s3.amazonaws.com/public.aro/geotel/geotel_fiber_${FIBER_STATE_ARRAY[0]}.zip -nd -nc
	$UNZIPTOOL geotel_fiber_${FIBER_STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -W "latin1" /$TMPDIR/geotel_fiber_${FIBER_STATE_ARRAY[0]}.dbf geotel.fiber_plant | ${PSQL}
# If there are two or more states, download the first file, create the table, then loop through the rest and append
elif [ ${fiber_state_array_len} > 1 ]; then
	rm -f ${TMPDIR}/*.*
	wget https://s3.amazonaws.com/public.aro/geotel/geotel_fiber_${FIBER_STATE_ARRAY[0]}.zip -nd -nc
	$UNZIPTOOL geotel_fiber_${FIBER_STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -W "latin1" /$TMPDIR/geotel_fiber_${FIBER_STATE_ARRAY[0]}.dbf geotel.fiber_plant | ${PSQL}

	for ((i=1; i<$fiber_state_array_len; i++ ));
	do
		rm -f ${TMPDIR}/*.*
		wget https://s3.amazonaws.com/public.aro/geotel/geotel_fiber_${FIBER_STATE_ARRAY[i]}.zip -nd -nc
		$UNZIPTOOL geotel_fiber_${FIBER_STATE_ARRAY[i]}.zip -d ${TMPDIR}
		${SHP2PGSQL} -a -s 4326 -g the_geom -W "latin1" /$TMPDIR/geotel_fiber_${${FIBER_STATE_ARRAY[i]}[i]}.dbf geotel.fiber_plant | ${PSQL}
	done
fi

# 2. Load Wirecenters

declare -a WIRECENTER_STATE_ARRAY=( 'wa' 'oh' )
wirecenter_state_array_len=${#WIRECENTER_STATE_ARRAY[@]}

# If there is only one state, download the file and create the table
if [ ${wirecenter_state_array_len} == 1 ]; then
	rm -f ${TMPDIR}/*.*
	wget https://s3.amazonaws.com/public.aro/geotel/geotel_wirecenters_${WIRECENTER_STATE_ARRAY[0]}.zip -nd -nc
	$UNZIPTOOL geotel_wirecenters_${WIRECENTER_STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -W "latin1" /$TMPDIR/geotel_wirecenters_${WIRECENTER_STATE_ARRAY[0]}/geotel_wirecenters_${WIRECENTER_STATE_ARRAY[0]}.dbf geotel.wirecenters | ${PSQL}
# If there are two or more states, download the first file, create the table, then loop through the rest and append
elif [ ${wirecenter_state_array_len} > 1 ]; then
	rm -f ${TMPDIR}/*.*
	wget https://s3.amazonaws.com/public.aro/geotel/geotel_wirecenters_${WIRECENTER_STATE_ARRAY[0]}.zip -nd -nc
	$UNZIPTOOL geotel_wirecenters_${WIRECENTER_STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -W "latin1" /$TMPDIR/geotel_wirecenters_${WIRECENTER_STATE_ARRAY[0]}/geotel_wirecenters_${WIRECENTER_STATE_ARRAY[0]}.dbf geotel.wirecenters | ${PSQL}

	for ((i=1; i<$wirecenter_state_array_len; i++ ));
	do
		rm -f ${TMPDIR}/*.*
		wget https://s3.amazonaws.com/public.aro/geotel/geotel_wirecenters_${WIRECENTER_STATE_ARRAY[i]}.zip -nd -nc
		$UNZIPTOOL geotel_wirecenters_${WIRECENTER_STATE_ARRAY[i]}.zip -d ${TMPDIR}
		${SHP2PGSQL} -a -s 4326 -g the_geom -W "latin1" /$TMPDIR/geotel_wirecenters_${WIRECENTER_STATE_ARRAY[i]}/geotel_wirecenters_${WIRECENTER_STATE_ARRAY[i]}.dbf geotel.wirecenters | ${PSQL}
	done
fi

# create a basic Carriers table
${PSQL} -a -f $DIR/geotel.carrier.sql

# create a alias table (This will be moved at some point)
${PSQL} -a -f $DIR/geotel.carrier_alias.sql

# Buffer Geotel routes and index into carrier table
${PSQL} -a -f $DIR/buffered_routes.sql


