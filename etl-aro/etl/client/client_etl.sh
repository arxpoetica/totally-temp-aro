#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Map carriers to locations to determine service coverage
${PSQL} -a -f $DIR/create_client_carrier_location_mapping.sql

# Create and load network node types table
${PSQL} -a -f $DIR/create_client_network_node_types.sql

# Create and load network nodes table
${PSQL} -a -f $DIR/create_client_network_nodes.sql

${PSQL} -a -f $DIR/create_client_graph.sql

# Populates a location entry fees table with fake data for 'client'. This should be replaced with real data later.
${PSQL} -a -f $DIR/load_location_entry_fees.sql

# Populates a business install costs table with fake data for 'client'. This should be replaced with real data later.
${PSQL} -a -f $DIR/load_business_install_costs.sql

# Populates a household install costs table with fake data for 'client'. This should be replaced with real data later.
${PSQL} -a -f $DIR/load_household_install_costs.sql

# Create and load a fake customer type (existing, prospect, etc.) table for the client
${PSQL} -a -f $DIR/create_client_customer_types.sql

# Create and load mapping tables for businesses and households to client's customer types
${PSQL} -a -f $DIR/create_client_customer_type_mapping.sql

# Create the tables for products and spend for a client
${PSQL} -a -f $DIR/create_client_spend.sql
python $DIR/manage.py data spend values add $DIR/reformatted_spend.csv
python $DIR/manage.py data spend mapping add $DIR/industry_mapping.csv

${PSQL} -a -f $DIR/create_city_spend_mapping.sql
