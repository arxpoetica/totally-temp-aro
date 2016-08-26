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

# Load
etl_cache:
	cache/etl.sh

###################
# Boundaries ETL
###################

reset_boundaries:

# Load
etl_boundaries:
	boundaries/etl.sh

###################
# Locations ETL
###################

reset_locations:

# Load
etl_locations:
	locations/etl.sh

###################
# Equipment ETL
###################

reset_equipment:

# Load
etl_equipment:
	equipment/etl.sh

###################
# Spend ETL
###################

reset_spend:

# Load
etl_spend:
	spend/etl.sh

###################
# Master ETL
###################

reset: reset_equipment reset_locations reset_spend reset_boundaries reset_carriers reset_cache
load: etl_carriers etl_boundaries etl_spend etl_locations etl_equipment reset_cache


etl_reload_all: reset load
