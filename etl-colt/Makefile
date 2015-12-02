reset_db:
	echo 'Should reset the db here...'

# TIGER ETL
#############
etl_tiger_cousub:
	etl/tiger/cousub_etl.sh

etl_tiger_edges:
	etl/tiger/edges_etl.sh

etl_tiger_census_blocks:
	etl/tiger/census_blocks_etl.sh

reset_tiger:
	etl/reset_tiger_data.sh

etl_tiger: etl_tiger_cousub etl_tiger_edges etl_tiger_census_blocks

# INFOUSA ETL
#############

reset_infousa:
	etl/reset_infousa_data.sh

etl_infousa:
	etl/infousa/infousa_etl.sh

# GEOTEL ETL
#############

reset_geotel:
	etl/reset_geotel_data.sh

etl_geotel:
	etl/geotel/geotel_etl.sh

# DEMOGRAPHICS ETL
#############

reset_demographics:
	etl/reset_demographics_data.sh

etl_demographics:
	etl/demographics/demographics_etl.sh

# ARO ETL
#############

reset_aro:
	etl/reset_aro_data.sh

etl_aro:
	etl/aro/aro_etl.sh

# CLIENT ETL
#############

reset_client:
	etl/reset_client_data.sh

etl_client:
	etl/client/client_etl.sh

# CUSTOM ETL
#############

reset_custom:
	etl/reset_custom_data.sh

etl_custom:
	etl/custom/custom_etl.sh

# COLT SOURCE ETL
#############

reset_source_colt:
	etl/reset_source_colt.sh

etl_source_colt:
	etl/source_colt/source_colt_etl.sh

etl_competitor_fiber:
	etl/source_colt/comp_fiber.sh

# MAIN ETL ACTIONS
###################################

# Include the ETLs you would like to leverage in reset, source, and app.
etl_reset_all: reset_demographics reset_aro reset_client reset_custom reset_source_colt

etl_source_data: etl_demographics etl_source_colt etl_competitor_fiber

etl_app_data: etl_aro etl_client etl_custom

etl_reload_all: reset_db etl_reset_all etl_source_data etl_app_data

# TEST ETL
###################################

etl_test_client:
	etl/test/client.sh

etl_test_custom:
	etl/test/custom.sh

etl_test_aro:
	etl/test/aro.sh

etl_test_all: etl_test_aro etl_test_custom etl_test_client

# SERVICES
#############

# service_deploy:
# 	(cp aro-service/target/aro-service.war aro-service/docker)

# service_build:
# 	(cd aro-service/docker && docker build -t aro-service .)

# service_run:
# 	(docker run -d -p 8080:8080 --name aro-service --link postgres:arodb aro-service)

# service_start:	service_build service_run

# service_stop:
# 	(docker stop aro-service && docker rm aro-service && docker rmi -f aro-service)

# service_restart: service_stop service_start

# service_redploy: service_stop service_deploy service_start

# APPLICATION SETUP
#############

# Install Node.js dependencies
webapp:
	(cd ../app && npm install --no-bin-link)

# Run application unit tests
test:
	(cd ../app && npm test)

# Boot the webserver at http://localhost:8000
webserver:
	(cd ../app && ARO_CLIENT=colt node app.js)

# Make a dummy user for local development
register_user:
	ARO_CLIENT=colt node ../app/cli/register_user -f Marty -l McFly -e aro@example.com -p password
