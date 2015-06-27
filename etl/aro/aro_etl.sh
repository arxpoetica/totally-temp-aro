#!/bin/bash

export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/create_aro_cousub.sql
${PSQL} -a -f $DIR/create_aro_graph.sql

# Create and load infousa_businesses table
${PSQL} -a -f $DIR/create_infousa_businesses.sql
cat /tmp/infousa_businesses.csv | ${PSQL} -c "COPY infousa.businesses FROM STDIN DELIMITER ',' CSV HEADER;"

# Create aro_locations table from infousa_businesses table
${PSQL} -a -f $DIR/create_aro_locations.sql

# Create aro_industries table from infousa_businesses table
${PSQL} -a -f $DIR/create_aro_industries.sql

# Create aro_businesses table from infousa_businesses table
${PSQL} -a -f $DIR/create_aro_businesses.sql