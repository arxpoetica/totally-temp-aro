reset_stage_reference:
	(cd etl/stage/reference && make reset)

load_stage_reference:
	(cd etl/stage/reference && make load)

reset_schema:
	(cd etl/schema && make reset)

load_schema:
	(cd etl/schema && make load)

reset_public:
	(cd etl/load/public && make reset)

load_public:
	(cd etl/load/public && make load)

reset_private:
	(cd etl/load/private && make reset)

load_private:
	(cd etl/load/private && make load)

reset_view:
		(cd etl/view/public && make reset)
load_view:
	(cd etl/view/public && make load)

reset_all: reset_schema load_schema reset_stage_reference reset_view reset_public
load_all:  load_stage_reference load_view load_public 

etl_reload_all: reset_all load_all

###################
# Web App Commands
###################

webapp:
	(cd ../app && npm install --no-bin-link && npm run build)

test:
	(cd ../app && npm test)

webserver:
	(cd ../app && ARO_CLIENT=verizon node app.js)

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
