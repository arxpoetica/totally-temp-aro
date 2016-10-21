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

rm -f ${TMPDIR}/*.*

# 1 of 3 conduit source files
if [ ! -f vzb_conduit_1.zip ]; then
	aws s3 cp s3://public.aro/proto/network_equipment/vzb_conduit_1.zip $GISROOT/vzb_conduit_1.zip
fi

$UNZIPTOOL vzb_conduit_1.zip -d ${TMPDIR}
${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/vzb_conduit_1.dbf network_equipment.vzb_conduit_1 | ${PSQL}

rm -f ${TMPDIR}/*.*

# 2 of 3 conduit source files
if [ ! -f vzb_conduit_2.zip ]; then
	aws s3 cp s3://public.aro/proto/network_equipment/vzb_conduit_2.zip $GISROOT/vzb_conduit_2.zip
fi

$UNZIPTOOL vzb_conduit_2.zip -d ${TMPDIR}
${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/vzb_conduit_2.dbf network_equipment.vzb_conduit_2 | ${PSQL}

rm -f ${TMPDIR}/*.*

# 3 of 3 conduit source files
if [ ! -f vzb_conduit_3.zip ]; then
	aws s3 cp s3://public.aro/proto/network_equipment/vzb_conduit_3.zip $GISROOT/vzb_conduit_3.zip
fi

$UNZIPTOOL vzb_conduit_3.zip -d ${TMPDIR}
${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/vzb_conduit_3.dbf network_equipment.vzb_conduit_3 | ${PSQL}

rm -f ${TMPDIR}/*.*

# Merge all conduit types into one table
${PSQL} -a -f $DIR/create_conduit.sql



