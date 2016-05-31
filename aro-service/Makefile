usage help:
	@echo '  Useful host OS targets include:'
	@echo '    war         (compile service war and copy to docker build dir)'
	@echo '  Useful virtualbox targets include:'
	@echo '    war_docker  (build and tag the service docker image)'
	@echo '    push        (pushes service docker image to altman registry)'
	@echo '    install     (build service docker image, run in vagrant)'
	@echo '    uninstall   (stop service container, rm container and rmi the aro-service image)'
	@echo '    reinstall   (uninstall, then install)'
	@echo '    node1       (launch ignite node container named 'node1' (works for node1 thru node4))'

compile_war:
	(mvn package -Dmaven.test.skip=true)

deploy_war:
	(cp ./aro-service/target/aro-service-1.0-SNAPSHOT.war ./docker/aro-service.war)

war rebuild_war: compile_war deploy_war

vagrant_tag tag:
	(docker tag aro-service ait-docker-registry.cloud.altvil.com/aro-service)

vagrant_build_docker build_docker:
	(cd docker && docker build -t aro-service .)

vagrant_build_docker_image build_docker_image war_docker: vagrant_build_docker vagrant_tag

run_service run_docker:
	(docker run -e PGUSER=${PGUSER} -e PGPASSWORD=${PGPASSWORD} -e PGHOST=${PGHOST} -e PGDATABASE=${PGDATABASE} -e ARO_THREAD_COUNT=5 -d -p 8080:8080 --name aro-service ait-docker-registry.cloud.altvil.com/aro-service)

build_tag_push: build_docker tag push

vagrant_push push:
	(docker push ait-docker-registry.cloud.altvil.com/aro-service)

vagrant_pull pull:
	(docker pull ait-docker-registry.cloud.altvil.com/aro-service)

pull_run: pull run_service

vagrant_pull_run pull_run_vagrant: pull vagrant_run_service

vagrant_uninstall uninstall:
	(docker stop aro-service && docker rm aro-service && docker rmi -f ait-docker-registry.cloud.altvil.com/aro-service)

vagrant_run_service vagrant_run vagrant_run_docker run_vagrant_docker:
	(docker run -e PGUSER=aro -e PGPASSWORD=aro -e PGHOST=arodb -e PGDATABASE=aro -e ARO_THREAD_COUNT=2 -d -p 8080:8080 --name aro-service --link postgres:arodb ait-docker-registry.cloud.altvil.com/aro-service)

vagrant_install install_vagrant install: build_docker_image run_vagrant_docker

vagrant_reinstall reinstall_vagrant reinstall: uninstall install_vagrant

###############################
#IGNITE NODES IN VAGRANT DOCKER

#vagrant_docker_pull_ignite:
#	(docker pull apacheignite/ignite:1.5.0.final)

refresh_docker_ignite_config:
	(cp aro-engine/src/main/resources/META-INF/igniteConfig-basicNode-docker.xml docker-ignite-node/.)
	(cp aro-engine/src/main/resources/META-INF/igniteConfig-abstract.xml docker-ignite-node/.)

vagrant_docker_build_ignite_base:
	(cd docker-ignite-jdk8 && docker build -t aro-ignite-jdk8 .)

vagrant_docker_build_ignite_node:
	(cd docker-ignite-node && docker build -t aro-ignite-basicnode .)

vagrant_docker_run_ignite:
	(docker run -e PGUSER=${PGUSER} -e PGPASSWORD=${PGPASSWORD} -e PGHOST=${PGHOST} -e PGDATABASE=${PGDATABASE} -e CONFIG_URI=igniteConfig-basicNode-docker.xml -e OPTION_LIBS=ignite-spring,ingite-indexing,ignite-slf4j,ignite-jta -it --net=default --name $(DOCKER_NAME) aro-ignite-basicnode)

node1 node2 node3 node4:
	(make vagrant_docker_run_ignite DOCKER_NAME=$@)

vagrant_ignite_visor:
	(docker run -it --rm aro-ignite-basicnode apache-ignite-fabric-1.5.0.final-bin/bin/ignitevisorcmd.sh)

###############################

