#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DATAROOT=/vagrant/aro-app-data/avco
TMPDIR=/tmp/arotmp
UNZIPTOOL=unzip
SHP2PGSQL=${PGBIN}/shp2pgsql
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

mkdir -p $TMPDIR

${PSQL} -c "DROP SCHEMA IF EXISTS client CASCADE;"
${PSQL} -c "CREATE SCHEMA client;"

echo 'Create and populate product types'
${PSQL} -f $DIR/sql/create_client_product_type.sql

echo 'Create and populate speed types'
${PSQL} -f $DIR/sql/create_client_speed_type.sql

echo 'Create and populate demand types'
${PSQL} -f $DIR/sql/create_client_demand_type.sql

echo 'Map carriers to locations to determine service coverage'
${PSQL} -f $DIR/sql/create_client_carrier_location_mapping.sql

echo 'Create and load network plan table'
${PSQL} -f $DIR/sql/create_client_plan.sql

echo 'Create and load network node types table'
${PSQL} -f $DIR/sql/create_client_network_node_types.sql

echo 'Create and load network nodes table'
${PSQL} -f $DIR/sql/create_client_network_nodes.sql

echo 'Create and load plan sources'
${PSQL} -f $DIR/sql/create_client_plan_sources.sql

echo 'Create and load plan targets'
${PSQL} -f $DIR/sql/create_client_plan_targets.sql

echo 'Create and load fiber type'
${PSQL} -f $DIR/sql/create_client_fiber_route_type.sql

echo 'Create boundaries'
${PSQL} -f $DIR/sql/create_client_boundaries.sql

echo 'Create and load fiber route'
${PSQL} -f $DIR/sql/create_client_fiber_route.sql

echo 'Populates a location entry fees table with fake data for client. This should be replaced with real data later.'
${PSQL} -f $DIR/sql/create_client_location_entry_fees.sql

echo 'Populates a business install costs table with fake data for client. This should be replaced with real data later.'
${PSQL} -f $DIR/sql/create_client_business_install_costs.sql

echo 'Populates a household install costs table with fake data for client. This should be replaced with real data later.'
${PSQL} -f $DIR/sql/create_client_household_install_costs.sql

echo 'Create and load a fake customer type (existing, prospect, etc.) table for the client'
${PSQL} -f $DIR/sql/create_client_customer_types.sql

echo 'Create and load mapping tables for businesses and households to client''s customer types'
${PSQL} -f $DIR/sql/create_client_customer_type_mapping.sql

echo 'Create entity category table'
${PSQL} -f $DIR/sql/create_client_entity_category.sql

echo 'Create business categories table'
${PSQL} -f $DIR/sql/create_client_business_category.sql

echo 'Create business categories view'
${PSQL} -f $DIR/sql/create_client_business_categories.sql

echo 'Map businesses to categories'
${PSQL} -f $DIR/sql/create_client_business_category_mapping.sql

echo 'Create household categories table'
${PSQL} -f $DIR/sql/create_client_household_categories.sql

echo 'Map households to categories'
${PSQL} -f $DIR/sql/create_client_household_category_mapping.sql

echo 'Create the tables for products and spend for a client'
${PSQL} -f $DIR/sql/create_client_spend.sql

echo 'Load industry and spend data and mappings'
python $DIR/python/manage.py data spend values add $DATAROOT/reformatted_spend.csv
python $DIR/python/manage.py data spend mapping add $DATAROOT/industry_mapping.csv

echo 'Update client spend with city data'
${PSQL} -f $DIR/sql/update_client_spend_with_city.sql

echo 'Create client selected regions (boundaries)'
${PSQL} -f $DIR/sql/create_client_selected_regions.sql

echo 'Create client demand views'
${PSQL} -f $DIR/sql/create_client_demand_views.sql

echo 'Create client location compentitor view'
${PSQL} -f $DIR/sql/create_client_location_competitors_view.sql

echo 'Create client business competitor strength view'
${PSQL} -f $DIR/sql/create_client_business_competitors_strength_view.sql

echo 'Create client summarized competitors strength'
${PSQL} -f $DIR/sql/create_client_summarized_competitors_strength.sql




