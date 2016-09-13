#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1


DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd $GISROOT;

declare -a STATE_ARRAY=( 'mo' 'wa_v2' 'wi' )
state_array_len=${#STATE_ARRAY[@]}

# If there is only one state, download the file and create the table
if [ ${state_array_len} == 1 ]; then
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/boundaries/cran_${STATE_ARRAY[0]}.zip $GISROOT/cran_${STATE_ARRAY[0]}.zip 
	$UNZIPTOOL cran_${STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/cran_${STATE_ARRAY[0]}.dbf boundaries.cran_${STATE_ARRAY[0]} | ${PSQL}
# If there are two or more states, download the first file, create the table, then loop through the rest and append
elif [ ${state_array_len} > 1 ]; then
	rm -f ${TMPDIR}/*.*
	aws s3 cp s3://public.aro/proto/boundaries/cran_${STATE_ARRAY[0]}.zip $GISROOT/cran_${STATE_ARRAY[0]}.zip 
	$UNZIPTOOL cran_${STATE_ARRAY[0]}.zip -d ${TMPDIR}
	${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/cran_${STATE_ARRAY[0]}.dbf boundaries.cran_${STATE_ARRAY[0]} | ${PSQL}

	for ((i=1; i<$state_array_len; i++ ));
	do
		rm -f ${TMPDIR}/*.*
		aws s3 cp s3://public.aro/proto/boundaries/cran_${STATE_ARRAY[i]}.zip $GISROOT/cran_${STATE_ARRAY[i]}.zip 
		$UNZIPTOOL cran_${STATE_ARRAY[i]}.zip -d ${TMPDIR}
		${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/cran_${STATE_ARRAY[i]}.dbf boundaries.cran_${STATE_ARRAY[i]} | ${PSQL}
		# Watch out for the -c here ^^^ this was a hack 
	done
fi

# Merge different boundaries into single source table
${PSQL} -a -f $DIR/create_cran_boundaries.sql