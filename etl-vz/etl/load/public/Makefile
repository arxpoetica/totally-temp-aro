###################
# Carriers ETL
###################

reset_carriers:

# Load
etl_carriers:
	carriers/etl.sh

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
# Master ETL
###################

reset: reset_equipment reset_locations, reset_boundaries reset_carriers
load: etl_carriers etl_boundaries etl_locations etl_equipment


etl_reload_all: reset load
