# aro-platform
(Now with 100% moar Docker)

## Contents

- [Overview](#overview)
- [Workstation Setup](#workstation-setup)
  - [Mac](#on-a-mac)
  - [Windows](#on-windows)
- [Local Development](#local-development)
  - [Application Setup](#initial-application-setup)
  - [Running the App](#running-the-application-in-development)
- [Continuous Integration and Deployment](#ci-builds-and-deployments)


# Overview

The ARO platform has been restructured into several different components, most of which are built as separate Docker containers:
  - `aro-app-base` is an Ubuntu 14.04 image with all the packages and components required to run the application compiled and installed. In local development environments, we run a container based on this image with the application code and (optionally) the ETL scripts/data mounted as volumes.
  - `aro-app` is the `aro-app-base` image with the application code already installed into it, as well as a startup command to start the PM2 service which runs the application. This is used in staging and production environments.
  - `aro-service` is the Java service that handles routing and optimization. In staging and production it is run as a separate Docker container. In local development, it is run as a separate Docker container by default, but it can be run direclty from its code for those brave souls who are Java developers. Its codebase has been moved (or will be moved shortly) to a seaprate Git repository, since it is largely independent of the Nodejs application.
  - `aro-etl` contains all source data (TIGER and other shapefiles, demographic data, client-provided data) and the bash/sql/python scripts that load it into a database. In staging and production it is attached as a Docker container with its volumes made available and shared with the app container. In local development, the checked out Git repository is made available to the app as a volume. **git-lfs is required before cloning this reppository.** More details are available in the [README for the aro-etl repository](http://octocat.altvil.com/AIT/aro-etl).
  - `aro-app-nginx` is an nginx web server image modified with the appropriate configuration to serve as a reverse-proxy to the PM2 service running the app and to serve static content. It is only used in staging and production environments.
  - In local development, the database is provided by a docker container. In staging and production we use Amazon RDS. The various docker-compose configuration files ensure that we are using the same versions of Postgres and PostGIS across all environments.

# Workstation Setup
In order to work with the application locally, you must first configure your workstation. This should be performed before cloning any of the repositories. If you already have a repository cloned locally (from prior development), it is recommened you delete it, or at least create a new, empty base working folder for the new iteration of the application.

## On a Mac
If you have [Virtualbox](https://www.virtualbox.org/wiki/Downloads) installed (e.g., from working with Vagrant), you must either upgrade it to the latest version or remove it entirely. The Docker installation is incompatible with older versions of Virtualbox.

Install [Docker](https://docs.docker.com/docker-for-mac/) on your workstation. This provides the `docker` client and `docker-compose`, both of which are requirements for making the application work.

Once installation is complete, edit the preferences/settings of the running application (by clicking on the Docker-whale icon in the menu/task bar). Under the "General" tab, ensure that you have at least 2 CPUs and 2GB of memory allocated. If you have a lot of RAM, you may want to increase the allocation to 3 or 4 GB. It is unlikely you'll see much benefit from allocationg more than 2 CPUs at this time, unless you plan on running *other* Dockerized applications on your machine simultaneously.  

Obtain credentials to the AIT Docker Registry. Then log into the registry with the following command:
```shell
$ docker login -u aro -e aro@altvil.com https://ait-docker-registry.cloud.altvil.com
```
This will prompt you for the password which will then be saved to your configuration and allow you to bypass entering the credentials in the future.  
***
Unless you will not ever be modifying source data or any of the ETL in development (i.e., in very rare cases), you need to install git-lfs on your machine. The recommended method is installation via homebrew. Homebrew installation and documentation can be found [here](http://brew.sh/).

Once you have homebrew, install and initialize git-lfs as follows:
```shell
$ brew install git-lfs
... prints some stuff ...
$ git lfs install
... prints some stuff ...
```
***
Once the prerequesites are installed, clone this (`aro-platform`) repository as well as the `aro-etl` repository in the same parent folder on your machine. Once complete, your directory structure should similar to this:
```
├-- project_root
    ├-- ARO-Platform
    |   ├-- app
    |   ├-- conf
    |   ├-- ..
    |   ├-- ..
    |   └-- (etc)
    └-- aro-etl
        ├-- data
        ├-- python
        ├-- sql
        ├-- .. 
        └-- (etc)
```

## On Windows
Native Docker support on Windows as of the time of this writng is still wonky at best and has a whole bunch of prerequesites and caveats that we don't want to deal with. As a workaround, we'll use the Docker Toolbox.  

Install the [Docker Toolbox](https://www.docker.com/products/docker-toolbox)  

Open a Docker Toolbox command window. This will automatically create an initial `default` docker machine, which we're going to have to remove so we can rebuild one with the correct parameters.  

More stuff here  
More stuff here  

Install git-lfs  
More stuff here 

Clone repositories
More stuff here 

# Local development
## Initial application setup
Before running the application the first time in local development, the application must be be initialized (node modules and libraries installed) and the databse must be populated. To do this we use the `run` command of `docker-compose` which will build and connect all the application compoenents that are required to run our setup/build scripts. This can be accomplished as follows:
```shell
$ docker-compose -f docker/docker-compose-dev-initialize.yml app run docker/initialize_app.sh
... some output here from the npm install process
```
In some cases, on a newly setup system, this process will fail the first time with a note about "call stack exceeded." Running the exact same command again should complete the process without issue. This is due to a known bug in the latest version of NPM and does not appear to cause any downstream issues.

If your log output ends with something that looks like the following, it has completed successfully:
```shell
...
...
public/javascripts/src/models/map_utils.js -> public/javascripts/lib/models/map_utils.js
public/javascripts/src/models/regions.js -> public/javascripts/lib/models/regions.js
public/javascripts/src/models/selection.js -> public/javascripts/lib/models/selection.js
public/javascripts/src/models/state.js -> public/javascripts/lib/models/state.js
public/javascripts/src/models/tracker.js -> public/javascripts/lib/models/tracker.js
```
***
Next, to populate the database and create an initial user, use the following command:
```shell
$ docker-compose -f docker/docker-compose-dev-initialize.yml app run etl/etl_initial_setup.sh
```
This will generate LOTS of output and can take anywhere from 40 - 60 minutes (or longer, depending on system specs) to complete.

## Running the application in development
As described earlier, in local development, your checked out version of the `ARO-Platform` repository is mapped into the `aro-app-base` container, so that code changes you make locally are immediately reflected in the running application. 

First run `docker ps` to ensure you don't have any duplicate or old versions of the containers already running. If you do, stop them with `docker stop <container_name> && docker rm <container_name>`  

To start the standard development environment, run the `docker-compose-dev` configuration as follows:
```shell
$ docker-compose -f docker/docker-compose-dev.yml up -d
```
This will start containers for all parts of the application, including the `aro-service` and run them in the background. However, the applciation server itself is not yet running. To start the application in local/debug mode, use the following command:
```shell
$ docker exec -it docker_app_1 runserver.sh
```
This will start the nodejs application and keep the debug log in the foreground. You can now connect to the application at https://localhost:8000. If you change the code, you'll need to Ctrl+C to kill the running task and then start it again in order to see the changes reflected.  

## Pulling in updates to Docker images (aro-service and aro-app-base)
Occasionally these images are updated. To incorporate the newest versions of the images into your local environment, you need to first bring down the environment and remove the current containers. This can be accomplished as follows:
```shell
$ docker-compose -f docker/docker-compose-dev.yml down
Stopping docker_app_1 ...
Stopping docker_service_1 ...
Stopping docker_db_1 ...
Removing docker_app_1 ... done
Removing docker_service_1 ...
Removing docker_db_1 ...
Removing network docker_default
$ docker-compose -f docker/docker-compose-dev.yml pull
```
Any changes to the underlying images will be pulled down and used the next time you bring up the environment. The database itself is always preserved, even if the database container/image is replaced, as we are using an external volume to store the actual data.

# CI builds and deployments
The general philosophy around deployments and environments has shifted. Please understand these changes and how they affect everyone's workflow.



## CircleCI

On any commit, CircleCI will automatically build the application, run tests, and report the results in the ARO slack channel.  

## Staging Deployments
Automatic deployments to various environments are configured in the `circle.yml` file. In general, deployments to environments are mapped to specific branches of the code, with certain configurations applied to the environments.  
Most client-facing environments (e.g., client-specific production environments, the "demo" server, etc) are tied to the `master` branch of code. Deployments to these environments are triggered manually.  

The `develop` branch of code is used by the `develop01` staging environment. Deployments to that server happen automatically on commits/merges to `develop` that pass tests in CircleCI. In order to test new features without affecting this environment, additional staging environments can be created for additional feature branches automatically by adding the branch to the deployment section in the `circle.yml` file. Once an environment is created from a branch, any additional commits or mergest to that branch will be automatically deployed to the specified environment.  
When the environment is no longer needed, it must be manually destroyed. This process will be automated at a later time.



