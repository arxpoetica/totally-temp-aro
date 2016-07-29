#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

GISROOT=/vagrant/aro-app-data/sita
TMPDIR=/tmp/arotmp
UNZIPTOOL=unzip
SHP2PGSQL=${PGBIN}/shp2pgsql

mkdir -p $TMPDIR


