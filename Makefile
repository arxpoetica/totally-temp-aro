etl_tiger_cousub:
	etl/tiger/cousub_etl.sh

etl_tiger_edges:
	etl/tiger/edges_etl.sh

etl_tiger: etl_tiger_cousub etl_tiger_edges

etl_infousa:
	etl/infousa/infousa_etl.sh

etl_aro:
	etl/aro/aro_etl.sh

reset_tiger:
	etl/reset_tiger_data.sh

reset_aro:
	etl/reset_aro_data.sh

reset_infousa:
	etl/reset_infousa_data.sh


etl_reload_all: reset_tiger reset_aro reset_infousa etl_tiger etl_infousa etl_aro


webapp:
	(cd app && npm install .)

test:
	(cd app && npm test)

webserver:
	(cd app && node app.js)

