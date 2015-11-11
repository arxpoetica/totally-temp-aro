#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Create the tables for products and spend for a client
${PSQL} -a -f $DIR/create_client_spend.sql
python $DIR/manage.py data spend values add $DIR/spend_data
python $DIR/manage.py data spend mapping add $DIR/