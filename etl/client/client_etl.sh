#!/bin/bash

export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_client_graph.sql
