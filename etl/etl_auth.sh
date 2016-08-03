#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

GISROOT=$ARO_DATA_ROOT
TMPDIR=/tmp/arotmp
UNZIPTOOL=unzip
SHP2PGSQL=${PGBIN}/shp2pgsql
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

mkdir -p $TMPDIR

${PSQL} -c "DROP SCHEMA IF EXISTS auth CASCADE;"
${PSQL} -c "CREATE SCHEMA auth;"


# Create auth.users table
${PSQL} -a -f $DIR/sql/create_auth_users.sql

# Create auth.permissions table
${PSQL} -a -f $DIR/sql/create_auth_permissions.sql