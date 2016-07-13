
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -a -f $DIR/cost_code_type.sql

${PSQL} -a -f $DIR/cost_code.sql

${PSQL} -a -f $DIR/cost_assignment.sql

${PSQL} -a -f $DIR/network_cost_code.sql

${PSQL} -a -f $DIR/network_code_detail.sql

${PSQL} -a -f $DIR/network_cost_code_node_type.sql

${PSQL} -a -f $DIR/network_code_fiber_type.sql

${PSQL} -a -f $DIR/network_price.sql

${PSQL} -a -f $DIR/report_type.sql

${PSQL} -a -f $DIR/network_report.sql

${PSQL} -a -f $DIR/plan_demand.sql

${PSQL} -a -f $DIR/plan_entity_demand.sql

${PSQL} -a -f $DIR/equipment_item_cost.sql

${PSQL} -a -f $DIR/equipment_summary_cost.sql

${PSQL} -a -f $DIR/fiber_item_cost.sql

${PSQL} -a -f $DIR/fiber_summary_cost.sql

${PSQL} -a -f $DIR/line_item_type.sql

${PSQL} -a -f $DIR/line_item.sql


