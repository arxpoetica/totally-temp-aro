usage help:
	@echo '    ---- Deployment Build Machine Commands'
	@echo '    deploy (run this on the build machine (compiles code, then creates a running docker image as well as registers docker image))'
	@echo '    redeploy (run this on the build machine (compiles code, then creates a running docker image as well as registers docker image))'
	@echo '    ---- Deployment Install  Commands'
	@echo '    pull_deploy (pull down docker image and start docker instance)'
	@echo '    pull_redeploy (unsitall current docker instance, then pull down docker image and start a new docker instance)'
	@echo '    ---- Dev  Commands'
	@echo '    war  (build and deploy war ready for DOCKER building. Typically done  on host machine)'
	@echo '    dev_redeploy (unsitall current docker instance, build new docker image and start a new docker instance, Typically done  on virtual machine)'
	@echo '    ---- IgniteCommands'
	@echo '    node1       (launch ignite node container named 'node1' (works for node1 thru node4))'

###############################
# Variables
###############################

ALTMAN_REGISTRY = ait-docker-registry.cloud.altvil.com
SERVICE_IMAGE = $(ALTMAN_REGISTRY)/aro-service
NODE_IMAGE = $(ALTMAN_REGISTRY)/aro-ignitenode

###############################
# Deployment Variables
###############################

DEPLOY_BRANCH = origin/development
DEPLOY_TARGET=server


###############################
# Server Deployment Tools
###############################

deploy: git_pull rebuild_war build_docker_image install push tail

redeploy: git_pull rebuild_war uninstall build_docker_image install push tail

pull_deploy:  pull run

pull_redeploy: uninstall pull run


###############################
# dev Deployment Tools
###############################

dev_redeploy: uninstall install	


###############################
# Compile targets
###############################

compile_war:
	(mvn package -Dmaven.test.skip=true)

deploy_war:
	(cp ./aro-service/target/aro-service-1.0-SNAPSHOT.war ./docker/aro-service.war)

war rebuild_war: compile_war deploy_war

###############################
# Docker targets
###############################

tag:
	(docker tag aro-service $(SERVICE_IMAGE))

push:
	(docker push $(SERVICE_IMAGE))

pull:
	(docker pull $(SERVICE_IMAGE))

build_docker:
	(cd docker && docker build -t aro-service .)

build_docker_image: build_docker tag

build_tag_push: build_docker tag push

uninstall:
	(docker stop aro-service && docker rm aro-service && docker rmi -f $(SERVICE_IMAGE))

run:
ifeq ($(DEPLOY_TARGET), server) 
	(docker run -e PGUSER=${PGUSER} -e PGPASSWORD=${PGPASSWORD} -e PGHOST=${PGHOST} -e PGDATABASE=${PGDATABASE} -e ARO_THREAD_COUNT=5 -d -p 8080:8080 --name aro-service $(SERVICE_IMAGE))
else  
	(docker run -e CATALINA_OPTS='' -e PGUSER=aro -e PGPASSWORD=aro -e PGHOST=arodb -e PGDATABASE=aro -e ARO_THREAD_COUNT=2 -d -p 8080:8080 --name aro-service --link postgres:arodb $(SERVICE_IMAGE))
endif


install: build_docker_image run


###############################
#IGNITE NODES IN VAGRANT DOCKER
###############################

#vagrant_docker_pull_ignite:
#	(docker pull apacheignite/ignite:1.5.0.final)

refresh_docker_ignite_config:
	(cp aro-engine/src/main/resources/META-INF/igniteConfig-basicNode-docker.xml docker-ignite-node/.)
	(cp aro-engine/src/main/resources/META-INF/igniteConfig-abstract.xml docker-ignite-node/.)

vagrant_docker_build_ignite_base:
	(cd docker-ignite-jdk8 && docker build -t aro-ignite-jdk8 .)

vagrant_docker_build_ignite_node:
	(cd docker-ignite-node && docker build -t $(NODE_IMAGE) .)

vagrant_docker_run_ignite:
	(docker run -e PGUSER=${PGUSER} -e PGPASSWORD=${PGPASSWORD} -e PGHOST=${PGHOST} -e PGDATABASE=${PGDATABASE} -e CONFIG_URI=igniteConfig-basicNode-docker.xml -e OPTION_LIBS=ignite-spring,ingite-indexing,ignite-slf4j,ignite-jta -it --net=default --name ${DOCKER_NAME} $(NODE_IMAGE))

node1 node2 node3 node4:
	($(MAKE) vagrant_docker_run_ignite DOCKER_NAME=$@)

vagrant_ignite_visor:
	(docker run -it --rm $(NODE_IMAGE) apache-ignite-fabric-1.5.0.final-bin/bin/ignitevisorcmd.sh)

###############################
# Def Util Tools
###############################

git_clone:
	(mkdir ~/aro && git clone https://octocat.altvil.com/AIT/ARO-Platform.git)
git_pull:
	(git pull)
git_log:
	(git log --oneline --decorate)
git_reset_head:
	(git reset --hard HEAD)
checkout_branch:
	(git checkout --track origin/$(branch))
tail:
	(sudo docker logs -f aro-service)



###############################
# EOF
###############################
