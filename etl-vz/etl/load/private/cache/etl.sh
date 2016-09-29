#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/cache_location_info.sql

${PSQL} -a -f $DIR/load_business_customer_types.sql

${PSQL} -a -f $DIR/load_household_category_mappings.sql

${PSQL} -a -f $DIR/load_household_install_costs.sql

${PSQL} -a -f $DIR/load_business_install_costs.sql

${PSQL} -a -f $DIR/load_location_entry_fees.sql

${PSQL} -a -f $DIR/load_location_carriers.sql

${PSQL} -a -f $DIR/location_distance_to_carrier.sql

${PSQL} -a -f $DIR/calculate_aro_locations_totals.sql

${PSQL} -a -f $DIR/load_analysis_area_assignment.sql



