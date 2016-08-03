etl_reload_all:
	bash ./etl_tiger.sh
	bash ./etl_vz_towers.sh
	bash ./etl_infousa.sh
	bash ./etl_geotel.sh
	bash ./etl_nbm.sh
	bash ./etl_sti.sh
	bash ./etl_aro.sh
	bash ./etl_client.sh
	bash ./etl_financial.sh

reset_auth:
	bash ./etl_auth.sh

register_user:
	node ../app/cli/register_user -f Marty -l McFly -e aro@example.com -p password -r admin
