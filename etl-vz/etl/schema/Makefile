###################
# User/Auth ETL
###################

reset_auth:
	auth/reset_auth_data.sh

etl_auth:
	auth/auth_etl.sh

###################
# Financial ETL
###################

reset_financial:
	financial/reset_financial.sh

etl_financial:
	financial/etl.sh


###################
# Client ETL
###################

reset_client:
	client/reset_client_data.sh

etl_client:
	client/client_etl.sh


###################
# ARO ETL
###################

reset_aro:
	aro/reset_aro_data.sh

etl_aro:
	aro/aro_etl.sh


###################
# Master ETL
###################


reset: reset_financial reset_client, reset_aro, reset_auth
load: etl_auth etl_aro etl_client etl_financial

etl_reload_all: reset load



