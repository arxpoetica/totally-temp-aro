###################
# TIGER ETL
###################

# Reset all of TIGER
reset_tiger:
	etl/reset_tiger_data.sh

# Reset all of TIGER data
etl_tiger: etl_tiger_cousub etl_tiger_edges etl_tiger_census_blocks

# Reset only County Subdivisions
etl_tiger_cousub:
	etl/tiger/cousub_etl.sh

# Reset only Edges
etl_tiger_edges:
	etl/tiger/edges_etl.sh

# Reset only Census Blocks
etl_tiger_census_blocks:
	etl/tiger/census_blocks_etl.sh


###################
# Boundaries ETL
###################

# Reset the entire boundaries schema
reset_boundaries:
	etl/reset_boundaries_data.sh

etl_boundaries: etl_cran_boundaries etl_cma_boundaries

etl_cran_boundaries:
	etl/boundaries/cran_boundaries_etl.sh

etl_cma_boundaries:
	etl/boundaries/cma_boundaries.sh


########################
# Network Equipment ETL
########################

reset_network_equipment:
	etl/reset_network_equipment_data.sh

etl_network_equipment: etl_hubs etl_ves_fiber

etl_hubs:
	etl/network_equipment/hubs_etl.sh

etl_ves_fiber:
	etl/network_equipment/ves_fiber_etl.sh


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
	etl/reset_businesses_data.sh

etl_businesses: etl_ves_lit etl_tam etl_vz_enterprise etl_vz_customers etl_infousa

# Load LIT VES businesses
etl_ves_lit:
	etl/businesses/vz_ves_lit_etl.sh

# Load TAM businesses
etl_tam:
	etl/businesses/vz_tam_etl.sh

etl_vz_enterprise:
	etl/businesses/vz_enterprise_etl.sh

etl_vz_customers:
	etl/businesses/vz_customers_etl.sh

# Load InfoUSA businesses
etl_infousa:
	etl/businesses/infousa_etl.sh


#######################################
# Households ETL
#######################################
reset_temp_hh:
	etl/reset_temp_hh.sh

etl_temp_hh:
	etl/temp_hh/temp_hh_etl.sh


###################
# GeoTel ETL
###################

reset_geotel:
	etl/reset_geotel_data.sh

etl_geotel:
	etl/geotel/geotel_etl.sh



###################
# NBM ETL
###################

reset_nbm:
	etl/reset_nbm_data.sh

etl_nbm:
	etl/nbm/nbm_etl.sh

###################
# Demographics ETL
###################

reset_demographics:
	etl/reset_demographics_data.sh

etl_demographics:
	etl/demographics/demographics_etl.sh

###################
# Financial ETL
###################

reset_financial:
	etl/reset_financial.sh

etl_financial:
	etl/financial/etl.sh


###################
# User/Auth ETL
###################

reset_auth:
	etl/reset_auth_data.sh

etl_auth:
	etl/auth/auth_etl.sh

###################
# ARO ETL
###################

reset_aro:
	etl/reset_aro_data.sh

etl_aro:
	etl/aro/aro_etl.sh

###################
# Client ETL
###################

reset_client:
	etl/reset_client_data.sh

etl_client:
	etl/client/client_etl.sh


###################
# Master ETL
###################

etl_reload_general: reset_tiger reset_towers reset_businesses reset_boundaries reset_geotel reset_network_equipment reset_demographics reset_nbm reset_temp_hh reset_aro etl_tiger etl_towers etl_businesses etl_boundaries etl_geotel etl_network_equipment etl_demographics etl_nbm etl_temp_hh etl_aro

etl_reload_client: reset_client etl_client reset_financial etl_financial

etl_reload_financial: reset_financial etl_financial

etl_reload_auth: reset_auth etl_auth

etl_reload_all: etl_reload_general etl_reload_client etl_reload_financial

etl_hard_reload: etl_reload_general etl_reload_client etl_reload_auth


###################
# Web App Commands
###################

webapp:
	(cd ../app && npm install --no-bin-link && npm run build)

test:
	(cd ../app && npm test)

webserver:
	(cd ../app && ARO_CLIENT=aro node app.js)

register_user:
	node ../app/cli/register_user -f Marty -l McFly -e aro@example.com -p password


###################
# Misc/Deprecated?
###################

etl_test_client:
	etl/test/client.sh

etl_test_aro:
	etl/test/aro.sh

etl_test_all: etl_test_aro etl_test_client

install_service:
	(cd ../aro-service  && make pull_deploy)

reinstall_service:
	(cd ../aro-service  && make uninstall && make pull_redeploy)


