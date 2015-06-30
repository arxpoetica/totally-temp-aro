#!/bin/bash

# Keeping this task separate so it can be called individually if needed, or not, since it takes so long
# Also it will need to be broken down into partitions by state as we do the same with the rest of the ETL

export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_routing_graph.sql