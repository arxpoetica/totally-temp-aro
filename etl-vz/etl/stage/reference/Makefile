###################
# Towers ETL
###################

# Reset the towers schema - SITA and client towers
reset_towers:
	ref_towers/reset.sh

etl_towers: 
	ref_towers/sita_towers_etl.sh

reload_towers: reset_towers etl_towers


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

reload_business: reset_businesses etl_businesses



###################
# TIGER ETL
###################

# Reset all of TIGER
reset_tiger:
	tiger/reset.sh

# Reset all of TIGER data
etl_tiger: etl_tiger_cousub etl_tiger_edges etl_tiger_census_blocks

# Reset only County Subdivisions
etl_tiger_cousub:
	tiger/cousub_etl.sh

# Reset only Edges
etl_tiger_edges:
	tiger/edges_etl.sh

# Reset only Census Blocks
etl_tiger_census_blocks:
	tiger/census_blocks_etl.sh

reload_tiger: reset_tiger etl_tiger

###################
# Boundaries ETL
###################

# Reset the entire boundaries schema
reset_boundaries:
	reference_boundaries/reset.sh

etl_boundaries: etl_cma_boundaries

etl_cma_boundaries:
	reference_boundaries/cma_boundaries.sh

reload_boundaries: reset_boundaries etl_boundaries

###################
# NBM ETL
###################

reset_nbm:
	nbm/reset_nbm_data.sh

etl_nbm:
	nbm/nbm_etl.sh

reload_nbm: reset_nbm etl_nbm

###################
# Demographics ETL
###################

reset_demographics:
	demographics/reset_demographics_data.sh

etl_demographics:
	demographics/demographics_etl.sh

reload_nbm: reset_demographics etl_demographics


###################
# Master ETL
###################

reset: reset_tiger reset_boundaries reset_geotel reset_demographics reset_nbm reset_towers reset_businesses
load: etl_tiger etl_boundaries etl_geotel etl_demographics etl_nbm etl_towers etl_businesses

etl_reload_all: reset load


