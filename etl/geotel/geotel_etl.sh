#!/bin/bash

export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql
SHP2PGSQL=${PGBIN}/shp2pgsql

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd /vagrant/etl/geotel/sample_data

# Create and load geotel.fiber_plant table
${SHP2PGSQL} -c -s 4269 -g the_geom -W "latin1" Geotel2015_KingWA_Shapefile.dbf geotel.fiber_plant | psql
