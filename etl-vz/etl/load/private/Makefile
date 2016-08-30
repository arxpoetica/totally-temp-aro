###################
# project ETL
###################

reset_project:

# Load
etl_project:
	project/etl.sh

###################
# aro ETL
###################

reset_aro:

# Load
etl_aro:
	aro/etl.sh

###################
# Carriers ETL
###################

reset_carriers:

# Load
etl_carriers:
	carriers/etl.sh

###################
# Cache ETL
###################

reset_cache:
	cache/reset.sh
# Load
etl_cache:
	cache/etl.sh

###################
# Boundaries ETL
###################

reset_boundaries:
	boundaries/reset.sh

# Load
etl_boundaries:
	boundaries/etl.sh

###################
# Locations ETL
###################

reset_locations:
	locations/reset.sh
# Load
etl_locations:
	locations/etl.sh

###################
# Equipment ETL
###################

reset_equipment:
	equipment/reset.sh

# Load
etl_equipment:
	equipment/etl.sh

###################
# Spend ETL
###################

reset_spend:
	spend/reset.sh

# Load
etl_spend:
	spend/etl.sh

###################
# Master ETL
###################

reset: reset_cache reset_carriers reset_boundaries reset_spend reset_locations reset_equipment reset_aro reset_project
load:etl_project etl_aro etl_carriers etl_boundaries etl_spend etl_locations etl_equipment etl_cache

etl_reload_all: reset load
