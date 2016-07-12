#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Create and poulate product types
${PSQL} -a -f $DIR/create_client_product_type.sql

# Map carriers to locations to determine service coverage
${PSQL} -a -f $DIR/create_client_carrier_location_mapping.sql

# Create and load network plan table
${PSQL} -a -f $DIR/create_client_plan.sql

# Create and load network node types table
${PSQL} -a -f $DIR/create_client_network_node_types.sql

# Create and load network nodes table
${PSQL} -a -f $DIR/create_client_network_nodes.sql

# Create and load plan sources
${PSQL} -a -f $DIR/create_client_plan_sources.sql

# Create and load plan targets
${PSQL} -a -f $DIR/create_client_plan_targets.sql

# Create and load fiber type
${PSQL} -a -f $DIR/create_client_fiber_route_type.sql

# Create boundaries
${PSQL} -a -f $DIR/create_client_boundaries.sql

# Create and load fiber route
${PSQL} -a -f $DIR/create_client_fiber_route.sql

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

# Create entity category table
${PSQL} -a -f $DIR/create_client_entity_category.sql

# Create business categories table
${PSQL} -a -f $DIR/create_client_business_category.sql

# Create business categories view
${PSQL} -a -f $DIR/create_client_business_categories.sql

# Map businesses to categories
${PSQL} -a -f $DIR/create_client_business_category_mapping.sql

# Create household categories table
${PSQL} -a -f $DIR/create_client_household_categories.sql

# Map households to categories
${PSQL} -a -f $DIR/create_client_household_category_mapping.sql

# Create the tables for products and spend for a client
${PSQL} -a -f $DIR/create_client_spend.sql
python $DIR/manage.py data spend values add $DIR/reformatted_spend.csv
python $DIR/manage.py data spend mapping add $DIR/industry_mapping.csv

${PSQL} -a -f $DIR/create_city_spend_mapping.sql

# Create boundaries
${PSQL} -a -f $DIR/create_client_selected_regions.sql

${PSQL} -a -f $DIR/create_client_demand.views.sql
