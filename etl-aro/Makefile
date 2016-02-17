etl_tiger_cousub:
	etl/tiger/cousub_etl.sh

etl_tiger_edges:
	etl/tiger/edges_etl.sh

etl_tiger_census_blocks:
	etl/tiger/census_blocks_etl.sh

etl_tiger: etl_tiger_cousub etl_tiger_edges etl_tiger_census_blocks

etl_sita: 
	etl/sita/sita_etl.sh

etl_infousa:
	etl/infousa/infousa_etl.sh

etl_geotel:
	etl/geotel/geotel_etl.sh

etl_demographics:
	etl/demographics/demographics_etl.sh

etl_aro:
	etl/aro/aro_etl.sh

etl_client:
	etl/client/client_etl.sh

etl_auth:
	etl/auth/auth_etl.sh

etl_custom:
	etl/custom/custom_etl.sh

reset_tiger:
	etl/reset_tiger_data.sh

reset_sita:
	etl/reset_sita_data.sh

reset_aro:
	etl/reset_aro_data.sh

reset_infousa:
	etl/reset_infousa_data.sh

reset_geotel:
	etl/reset_geotel_data.sh

reset_demographics:
	etl/reset_demographics_data.sh

reset_client:
	etl/reset_client_data.sh

reset_custom:
	etl/reset_custom_data.sh

reset_auth:
	etl/reset_auth_data.sh

etl_reload_general: reset_tiger reset_sita reset_infousa reset_geotel reset_demographics reset_aro etl_tiger etl_sita etl_infousa etl_geotel etl_demographics etl_aro

etl_reload_client: reset_client reset_custom reset_auth etl_client etl_custom etl_auth

etl_reload_all: etl_reload_general etl_reload_client

etl_test_client:
	etl/test/client.sh

etl_test_custom:
	etl/test/custom.sh

etl_test_aro:
	etl/test/aro.sh

etl_test_all: etl_test_aro etl_test_custom etl_test_client


service_deploy:
	(cp ../aro-service/target/aro-service.war aro-service/docker)

service_build:
	(cd ../aro-service/docker && docker build -t aro-service .)

service_run:
	(docker run -d -p 8080:8080 --name aro-service --link postgres:arodb aro-service)

service_start:  service_build service_run

service_stop:
	(docker stop aro-service && docker rm aro-service && docker rmi -f aro-service)

service_restart: service_stop service_start

service_redploy: service_stop service_deploy service_start


webapp:
	(cd ../app && npm install --no-bin-link && npm run build)

test:
	(cd ../app && npm test)

webserver:
	(cd ../app && ARO_CLIENT=aro node app.js)

register_user:
	node ../app/cli/register_user -f Marty -l McFly -e aro@example.com -p password
