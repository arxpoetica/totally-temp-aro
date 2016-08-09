# aro-platform
(Now with 100% moar Docker)

## Overview

The ARO platform has been restructured into several different components, most of which are built as separate Docker containers:
  - `aro-app-base` is an Ubuntu 14.04 image with all the packages and components required to run the application compiled and installed. In local development environments, we run a container based on this image with the application code and (optionally) the ETL scripts/data mounted as volumes.
  - `aro-app` is the `aro-app-base` image with the application code already installed into it, as well as a startup command to start the PM2 service which runs the application. This is used in staging and production environments.
  - `aro-service` is the Java service that handles routing and optimization. In staging and production it is run as a separate Docker container. In local development, it is run as a separate Docker container by default, but it can be run direclty from its code for those brave souls who are Java developers. Its codebase has been moved (or will be moved shortly) to a seaprate Git repository, since it is largely independent of the Nodejs application.
  - `aro-etl` contains all source data (TIGER and other shapefiles, demographic data, client-provided data) and the bash/sql/python scripts that load it into a database. In staging and production it is attached as a Docker container with its volumes made available and shared with the app container. In local development, the checked out Git repository is made available to the app as a volume. **git-lfs is required before cloning this reppository.** More details are available in the [README for the aro-etl repository](http://octocat.altvil.com/AIT/aro-etl).
  - `aro-app-nginx` is an nginx web server image modified with the appropriate configuration to serve as a reverse-proxy to the PM2 service running the app and to serve static content. It is only used in staging and production environments.
  - In local development, the database is provided by a docker container. In staging and production we use Amazon RDS. The various docker-compose configuration files ensure that we are using the same versions of Postgres and PostGIS across all environments.

## Workstation Setup
In order to work with the application locally, you must first configure your workstation. This should be performed before cloning any of the repositories. If you already have a repository cloned locally (from prior development), it is recommened you delete it, or at least create a new, empty base working folder for the new iteration of the application. 
These instructions *should* apply universally, but they are generally targeted toward users developing on OSX. If your base OS is Windows or especially Linux, you may encounter subtle differences in how things work. Additionally, the basic interaction (in terms of command line operation and how to open/install various applications) will be different. Please adjust accordingly or ask for help where needed.

  - If you already have [Virtualbox](https://www.virtualbox.org/wiki/Downloads) installed (e.g., from working with Vagrant), you must either upgrade it to the latest version or remove it entirely. The Docker installation is incompatible with older versions of Virtualbox.
  - Install [Docker](https://docs.docker.com/docker-for-mac/) on your workstation. This provides the `docker` client and `docker-compose`, both of which are requirements for making the application work.
  - Once installation is complete, edit the preferences/settings of the running application (by clicking on the Docker-whale icon in the menu/task bar). Under the "General" tab, ensure that you have at least 2 CPUs and 2GB of memory allocated. If you have a lot of RAM, you may want to increase the allocation to 3 or 4 GB. It is unlikely you'll see much benefit from allocationg more than 2 CPUs at this time, unless you plan on running OTHER Dockerized applications on your machine simultaneously.
  - Obtain credentials to the AIT Docker Registry. Then log into the registry with the following command:
  ```console
  $ docker login -u aro -e aro@altvil.com https://ait-docker-registry.cloud.altvil.com
  ```
  This will prompt you for the password which will then be saved to your configuration and allow you to bypass entering the credentials in the future.
  - If you intend to work with source data or modify any of the ETL in development, you need to install git-lfs on your machine.






