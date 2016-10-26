###################
# Boundaries ETL
###################

# Reset the entire boundaries schema
reset_boundaries:
	boundaries/reset.sh

etl_boundaries: etl_cran_boundaries etl_directional_facilities_boundaries

etl_cran_boundaries:
	boundaries/cran_boundaries_etl.sh

etl_directional_facilities_boundaries:
	boundaries/df_boundaries_etl.sh


########################
# Network Equipment ETL
########################

reset_network_equipment:
	network_equipment/reset.sh

etl_network_equipment: etl_hubs etl_ves_fiber etl_conduit etl_directional_facilities 

etl_hubs:
	network_equipment/hubs_etl.sh

etl_ves_fiber:
	network_equipment/ves_fiber_etl.sh

etl_conduit:
	network_equipment/conduit_etl.sh

etl_directional_facilities:
	network_equipment/directional_facilities_etl.sh


###################
# Towers ETL
###################

# Reset the towers schema - SITA and client towers
reset_towers:
	towers/reset.sh

etl_towers: 
	towers/towers_etl.sh


#######################################
# Businesses ETL
#######################################

# Reset businesses
reset_businesses:
	businesses/reset.sh

etl_businesses: etl_tam etl_vz_customers

# Load TAM businesses
etl_tam:
	businesses/vz_tam_etl.sh

etl_vz_customers:
	businesses/vz_customers_etl.sh


#######################################
# Households ETL
#######################################

reset_households:
	households/reset.sh

etl_households:
	households/etl.sh


###################
# Master ETL
###################

reset: reset_businesses reset_towers reset_network_equipment reset_boundaries
load:  etl_businesses etl_towers etl_network_equipment etl_boundaries

etl_reload_all: reset load


