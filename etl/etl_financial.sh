#!/bin/bash

export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DATAROOT=$ARO_DATA_ROOT/avco
TMPDIR=/tmp/arotmp
UNZIPTOOL=unzip
SHP2PGSQL=${PGBIN}/shp2pgsql
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

mkdir -p $TMPDIR

${PSQL} -c "DROP SCHEMA IF EXISTS financial CASCADE;"
${PSQL} -c "CREATE SCHEMA financial;"

echo 'Create financial cost code type'
${PSQL} -f $DIR/sql/create_financial_cost_code_type.sql

echo 'Create financial cost code'
${PSQL} -f $DIR/sql/create_financial_cost_code.sql

echo 'Create financial cost assignment'
${PSQL} -f $DIR/sql/create_financial_cost_assignment.sql

echo 'Create financial network cost code'
${PSQL} -f $DIR/sql/create_financial_network_cost_code.sql

echo 'Create financial network code detail'
${PSQL} -f $DIR/sql/create_financial_network_code_detail.sql

echo 'Create financial network cost code node type'
${PSQL} -f $DIR/sql/create_financial_network_cost_code_node_type.sql

echo 'Create financial network code fiber type'
${PSQL} -f $DIR/sql/create_financial_network_code_fiber_type.sql

echo 'Create financial network price'
${PSQL} -f $DIR/sql/create_financial_network_price.sql

echo 'Create financial report type'
${PSQL} -f $DIR/sql/create_financial_report_type.sql

echo 'Create financial network report'
${PSQL} -f $DIR/sql/create_financial_network_report.sql

echo 'Create financial plan demand'
${PSQL} -f $DIR/sql/create_financial_plan_demand.sql

echo 'Create financial plan entity demand'
${PSQL} -f $DIR/sql/create_financial_plan_entity_demand.sql

echo 'Create financial equipment item cost'
${PSQL} -f $DIR/sql/create_financial_equipment_item_cost.sql

echo 'Create financial equipment summary cost'
${PSQL} -f $DIR/sql/create_financial_equipment_summary_cost.sql

echo 'Create financial fiber item cost'
${PSQL} -f $DIR/sql/create_financial_fiber_item_cost.sql

echo 'Create financial fiber summary cost'
${PSQL} -f $DIR/sql/create_financial_fiber_summary_cost.sql

echo 'Create financial line item type'
${PSQL} -f $DIR/sql/create_financial_line_item_type.sql

echo 'Create financial line item'
${PSQL} -f $DIR/sql/create_financial_line_item.sql

echo 'Create financial roic component input'
${PSQL} -f $DIR/sql/create_financial_roic_component_input.sql
