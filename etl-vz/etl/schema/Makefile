###################
# ARO ETL
###################

reset_reference:
	reference/reset.sh

etl_reference:
	reference/aro_etl.sh

###################
# USER_DATA ETL
###################

reset_user_data:
	user_data/reset.sh

etl_user_data:
	user_data/etl.sh

###################
# User/Auth ETL
###################

reset_auth:
	auth/reset.sh

etl_auth:
	auth/auth_etl.sh

###################
# Financial ETL
###################

reset_financial:
	financial/reset.sh

etl_financial:
	financial/etl.sh


###################
# Client ETL
###################

reset_client:
	client/reset.sh

etl_client:
	client/client_etl.sh


###################
# ARO ETL
###################

reset_aro:
	aro/reset.sh

etl_aro:
	aro/aro_etl.sh

###################
# UTILS
###################

load_utils:
	utils/load_utils.sh


###################
# cache ETL
###################

reset_cache:
	cache/reset.sh

etl_cache:
	cache/cache_etl.sh

###################
# Master ETL
###################


reset: reset_financial reset_client reset_aro reset_cache reset_user_data reset_reference
load: etl_reference etl_user_data etl_aro etl_client etl_financial etl_cache load_utils

etl_reload_auth: reset_auth etl_auth
etl_reload_all: reset load



