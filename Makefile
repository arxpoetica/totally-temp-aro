etl_tiger_cousub:
	etl/tiger/cousub_etl.sh

etl_tiger_edges:
	etl/tiger/edges_etl.sh

etl_tiger_census_blocks:
	etl/tiger/census_blocks_etl.sh

etl_tiger: etl_tiger_cousub etl_tiger_edges etl_tiger_census_blocks

etl_infousa:
	etl/infousa/infousa_etl.sh

etl_geotel:
	etl/geotel/geotel_etl.sh

etl_aro:
	etl/aro/aro_etl.sh

etl_client:
	etl/client/client_etl.sh

reset_tiger:
	etl/reset_tiger_data.sh

reset_aro:
	etl/reset_aro_data.sh

reset_infousa:
	etl/reset_infousa_data.sh

reset_geotel:
	etl/reset_geotel_data.sh

reset_client:
	etl/reset_client_data.sh

etl_reload_general: reset_tiger reset_infousa reset_geotel reset_aro etl_tiger etl_infousa etl_geotel etl_aro

etl_reload_client: reset_client etl_client

etl_reload_all: etl_reload_general etl_reload_client


webapp:
	(cd app && npm install .)

test:
	(cd app && npm test)

webserver:
	(cd app && node app.js)

