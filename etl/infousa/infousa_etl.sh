#!/bin/bash

export PGDATABASE=aro
export PGUSER=aro
export PGPASSWORD=aro
export PGHOST=localhost
export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from


# Create and load infousa_businesses table
${PSQL} -a -f $DIR/create_infousa_businesses.sql

# TOTO: remove hard-coded path and find a better way of loading this data
cat /vagrant/etl/infousa/sample_data/infousa_businesses.csv | ${PSQL} -c "COPY infousa.businesses FROM STDIN DELIMITER ',' CSV HEADER;"