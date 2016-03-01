
compile_war:
	(mvn package -Dmaven.test.skip=true)

deploy_war:
	(cp ./aro-service/target/aro-service-1.0-SNAPSHOT.war ./docker/aro-service.war)

rebuild_war: compile_war deploy_war

build_docker:
	(cd docker && docker build -t aro-service .)

run_docker:
	(docker run -e PGUSER=${PGUSER} -e PGPASSWORD=${PGPASSWORD} -e PGHOST=${PGHOST} -e PGDATABASE=${PGDATABASE} -e ARO_THREAD_COUNT=5 -d -p 8080:8080 --name aro-service aro-service)

install: build_docker run_docker

uninstall:
	(docker stop aro-service && docker rm aro-service && docker rmi -f aro-service)

reinstall: uninstall install

run_vagrant_docker:
	(docker run -e PGUSER=aro -e PGPASSWORD=aro -e PGHOST=arodb -e PGHOST=${PGHOST} -e PGDATABASE=aro -e ARO_THREAD_COUNT=2 -d -p 8080:8080 --name aro-service --link postgres:arodb aro-service)
	#(docker run -d -p 8080:8080 --name aro-service --link postgres:arodb aro-service)
install_vagrant: build_docker run_vagrant_docker

reinstall_vagrant: uninstall install_vagrant