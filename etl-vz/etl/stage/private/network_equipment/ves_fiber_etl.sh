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

# 1 of 2 fiber source files
if [ ! -f vzb_fiber_part1.zip ]; then
	aws s3 cp s3://public.aro/proto/network_equipment/vzb_fiber_part1.zip $GISROOT/vzb_fiber_part1.zip
fi

$UNZIPTOOL vzb_fiber_part1.zip -d ${TMPDIR}
${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/vzb_fiber_part1.dbf network_equipment.vzb_fiber_part1 | ${PSQL}

# 2 of 2 fiber source files
if [ ! -f vzb_fiber_part2.zip ]; then
	aws s3 cp s3://public.aro/proto/network_equipment/vzb_fiber_part2.zip $GISROOT/vzb_fiber_part2.zip
fi

$UNZIPTOOL vzb_fiber_part2.zip -d ${TMPDIR}
${SHP2PGSQL} -c -s 4326 -g the_geom -t 2D -W "latin1" /$TMPDIR/vzb_fiber_part2.dbf network_equipment.vzb_fiber_part2 | ${PSQL}


# Merge both fiber types into one table
${PSQL} -a -f $DIR/create_fiber.sql



