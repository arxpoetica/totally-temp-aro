

###################
# Towers ETL
###################

# Reset the towers schema - SITA and client towers
reset_towers:
	etl/reset_towers_data.sh

etl_towers: 
	etl/towers/towers_etl.sh


#######################################
# Businesses ETL
#######################################

# Reset businesses
reset_businesses:
	etl/reset.sh

etl_businesses: etl_infousa

# Load InfoUSA businesses
etl_infousa:
	etl/businesses/infousa_etl.sh


###################
# Master ETL
###################


reload_business: reset_businesses etl_businesses
reload_towers: reset_towers etl_towers

reset: reset_towers reset_businesses
load: etl_towers etl_businesses

etl_reload_all: reset load
