#!/bin/bash
set -e;

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

IFS=',' read -a STATE_ARRAY <<< "${STATE_CODES}"
FIBER_TARGET_SCHEMA='geotel_fiber_data'
WIRECENTER_TARGET_SCHEMA='geotel_wirecenter_data'

cd $GISROOT;

for STATE_CODE in "${STATE_ARRAY[@]}"
do
	rm -f ${TMPDIR}/*.*

	#1. Load Fiber
	if [ ! -f $GISROOT/geotel_fiber_${STATE_CODE}.zip ]; then
		aws s3 cp s3://public.aro/geotel/geotel_fiber_${STATE_CODE}.zip $GISROOT/geotel_fiber_${STATE_CODE}.zip
	fi

	$UNZIPTOOL geotel_fiber_${STATE_CODE}.zip -d ${TMPDIR}
	${PSQL} -c "SELECT create_geotel_fiber_partition_table('${STATE_CODE}', '${FIBER_TARGET_SCHEMA}');"
	${SHP2PGSQL} -a -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/geotel_fiber_${STATE_CODE}.dbf ${FIBER_TARGET_SCHEMA}.fiber_plant_${STATE_CODE} | ${PSQL}

	#2. Load Wirecenters
	if [ ! -f $GISROOT/geotel_wirecenters_${STATE_CODE}.zip ]; then
		aws s3 cp s3://public.aro/geotel/geotel_wirecenters_${STATE_CODE}.zip $GISROOT/geotel_wirecenters_${STATE_CODE}.zip
	fi
	
	$UNZIPTOOL geotel_wirecenters_${STATE_CODE}.zip -d ${TMPDIR}
	${PSQL} -c "SELECT create_geotel_wirecenters_partition_table('${STATE_CODE}', '${WIRECENTER_TARGET_SCHEMA}');"
	${SHP2PGSQL} -a -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/geotel_wirecenters_${STATE_CODE}.dbf ${WIRECENTER_TARGET_SCHEMA}.wirecenters_${STATE_CODE} | ${PSQL}
done

# create a basic Carriers table
${PSQL} -a -f $DIR/geotel_carrier.sql

# create a alias table (This will be moved at some point)
${PSQL} -a -f $DIR/geotel_carrier_alias.sql

# Buffer Geotel routes and index into carrier table
${PSQL} -a -f $DIR/buffered_routes.sql
