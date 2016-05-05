
compile_war:
	(mvn package -Dmaven.test.skip=true)

deploy_war:
	(cp ./aro-service/target/aro-service-1.0-SNAPSHOT.war ./docker/aro-service.war)

rebuild_war: compile_war deploy_war

tag:
	(docker tag aro-service docker-registry.cloud.altvil.com/aro-service)

build_docker:
	(cd docker && docker build -t aro-service .)

build_docker_image: build_docker tag

run_docker:
	(docker run -e PGUSER=${PGUSER} -e PGPASSWORD=${PGPASSWORD} -e PGHOST=${PGHOST} -e PGDATABASE=${PGDATABASE} -e ARO_THREAD_COUNT=5 -d -p 8080:8080 --name aro-service docker-registry.cloud.altvil.com/aro-service)


build_tag_push: build_docker tag push

push:
	(docker push docker-registry.cloud.altvil.com/aro-service)

pull:
	(docker pull docker-registry.cloud.altvil.com/aro-service)

pull_run: pull run_docker

pull_run_vagrant: pull run_vagrant_docker

uninstall:
	(docker stop aro-service && docker rm aro-service && docker rmi -f docker-registry.cloud.altvil.com/aro-service)

reinstall: uninstall install

install: build_docker_image run_vagrant_docker

run_vagrant_docker:
	(docker run -e PGUSER=aro -e PGPASSWORD=aro -e PGHOST=arodb -e PGDATABASE=aro -e ARO_THREAD_COUNT=2 -d -p 8080:8080 --name aro-service --link postgres:arodb docker-registry.cloud.altvil.com/aro-service)

install_vagrant: build_docker_image run_vagrant_docker

reinstall_vagrant: uninstall install_vagrant

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

vagrant_ignite_visor:
	(docker run -it --rm aro-ignite-basicnode apache-ignite-fabric-1.5.0.final-bin/bin/ignitevisorcmd.sh)

###############################

