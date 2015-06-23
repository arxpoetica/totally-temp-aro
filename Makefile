etl_tiger_cousub:
	etl/tiger_cousub/cousub_etl.sh

etl_tiger_edges:
	etl/tiger_edges/edges_etl.sh

etl_tiger: etl_tiger_cousub etl_tiger_edges

reset_tiger:
	etl/reset_tiger_data.sh

application:
	(cd app && npm install .)

