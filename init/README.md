# Environment Setup
(jelly-donut / ARO Platform)

**Contents**

 - [Intro](#intro)
 - [Prerequisites](#prerequisites)
 - [Walkthrough](#walkthrough)
 	- [Instance Setup](#instance-setup)
 	- [Loading Data](#loading-data)
 	- [Application Setup](#application-setup)
 - [Config Updates](#config-updates)

## Intro
These instructions are for building, configuring, and managing your local development environment.

By following the walkthrough you will accomplish the following:
 * Build and provision a Vagrant virtual machine for running the `jelly-donut` application locally
 * Load the following test dataset:
 	* TIGER 2014 County-Subdivision objects for the state of New York
 	* TIGER 2014 Edges (road segment) objects for Kings County New York (Brooklyn)
 * Generate routing topology for those road segments
 * Build, test, and run the webapp that allows viewing those objects on a map, toggling them, and creating simple routes
 	* App will continue to do more as development progresses

After the walkthrough, there are instructions for updating and reprovisioning the Vagrant machine to pull in configuration changes. Those steps are only necessary when the configuration changes. They are not part of the intial first-time setup process.

## Prerequisites
0. Virualbox
0. Vagrant

## Walkthrough
#### Instance Setup
1. Clone repository, then navigate to the root of the repository: 
```console
$ git clone git@github.com:AVCo/ARO-Platform
Cloning into 'ARO-Platform'...
remote: Counting objects: 133, done.
remote: Compressing objects: 100% (6/6), done.
remote: Total 133 (delta 2), reused 0 (delta 0), pack-reused 127
Receiving objects: 100% (133/133), 29.79 KiB | 0 bytes/s, done.
Resolving deltas: 100% (46/46), done.
Checking connectivity... done.
$ cd ARO-Platform
```
2. Initialize configuration submodule: 
```console
$ git submodule init
Submodule 'ops/config' (git@github.com:AVCo/ARO-config) registered for path 'ops/config'
```
3. Update the configuration submodule:
```console
$ git submodule update
Cloning into 'ops/config'...
remote: Counting objects: 15, done.
remote: Compressing objects: 100% (11/11), done.
remote: Total 15 (delta 2), reused 11 (delta 1), pack-reused 0
Receiving objects: 100% (15/15), done.
Resolving deltas: 100% (2/2), done.
Checking connectivity... done.
Submodule path 'ops/config': checked out '91cf362cfa843c895170f0e34143d192d201ecc8'
```
4. Start the Vagrant machine, which will automatically kick-off provisioning:
```console
$ vagrant up
Bringing machine 'app' up with 'virtualbox' provider...
==> app: Importing base box 'ubuntu/trusty64'...
==> app: Matching MAC address for NAT networking...
==> app: Checking if box 'ubuntu/trusty64' is up to date...
==> app: Setting the name of the VM: ARO-Platform_app_1435158327210_47193
==> app: Clearing any previously set forwarded ports...
==> app: Clearing any previously set network interfaces...
==> app: Preparing network interfaces based on configuration...
    app: Adapter 1: nat
==> app: Forwarding ports...
    app: 8000 => 8000 (adapter 1)
    app: 5432 => 5432 (adapter 1)
    app: 22 => 2222 (adapter 1)
==> app: Running 'pre-boot' VM customizations...
==> app: Booting VM...
==> app: Waiting for machine to boot. This may take a few minutes...
    app: SSH address: 127.0.0.1:2222
    app: SSH username: vagrant
    app: SSH auth method: private key
...
...
```
This will go on for a while. At the end of successful provisioning you will see the following:
```console
==> app: [2015-06-24 15:09:13]  INFO [opsworks-agent(20040)]: Finished Chef run with exitcode 0
```
5. Connect into the Vagrant virtual machine and navigate to the application root:
```console
$ vagrant ssh
Welcome to Ubuntu 14.04.2 LTS (GNU/Linux 3.13.0-55-generic x86_64)

 * Documentation:  https://help.ubuntu.com/

  System information as of Wed Jun 24 15:05:48 UTC 2015

  System load:  0.15              Processes:           90
  Usage of /:   3.2% of 39.34GB   Users logged in:     0
  Memory usage: 6%                IP address for eth0: 10.0.2.15
  Swap usage:   0%

  Graph this data and manage this system at:
    https://landscape.canonical.com/

  Get cloud support with Ubuntu Advantage Cloud Guest:
    http://www.ubuntu.com/business/services/cloud

0 packages can be updated.
0 updates are security updates.

vagrant@opsworks-vagrant:~$ cd /vagrant
vagrant@opsworks-vagrant:/vagrant$ 
```

The following instructions (Loading Data and Applicaiton Setup) are executed from the application root inside the virtual machine.

#### Loading Data
The initial loading of sample data can be completed with a single command:
```console
$make etl_reload_all
etl/reset_tiger_data.sh
DROP EXTENSION
NOTICE:  schema "tiger_data" does not exist, skipping
DROP SCHEMA
NOTICE:  schema "tiger_staging" does not exist, skipping
DROP SCHEMA
DROP SCHEMA
CREATE EXTENSION
etl/reset_aro_data.sh
NOTICE:  schema "aro" does not exist, skipping
DROP SCHEMA
CREATE SCHEMA
etl/tiger_cousub/cousub_etl.sh
NOTICE:  schema "tiger_staging" does not exist, skipping
DROP SCHEMA
CREATE SCHEMA
--2015-06-24 15:55:06--  ftp://ftp2.census.gov/geo/tiger/TIGER2014/COUSUB/tl_2014_36_cousub.zip
           => ‘tl_2014_36_cousub.zip’
Resolving ftp2.census.gov (ftp2.census.gov)... 148.129.75.35, 2610:20:2010:a09:1000:0:9481:4b23
...
...
psql:/vagrant/etl/aro/build_graph.sql:5: NOTICE:  -------------> TOPOLOGY CREATED FOR  23104 edges
psql:/vagrant/etl/aro/build_graph.sql:5: NOTICE:  Rows with NULL geometry or NULL id: 0
psql:/vagrant/etl/aro/build_graph.sql:5: NOTICE:  Vertices table for table aro.edges is: aro.edges_vertices_pgr
psql:/vagrant/etl/aro/build_graph.sql:5: NOTICE:  ----------------------------------------------
 pgr_createtopology 
--------------------
 OK
(1 row)
```
#### Application Setup
1. Install node application dependencies using the following command:
```console
$ make webapp
(cd app && npm install .)
npm WARN package.json aro@0.0.0 No repository field.
npm WARN package.json aro@0.0.0 No README data
compression@1.5.0 node_modules/compression
├── bytes@2.1.0
├── on-headers@1.0.0
├── vary@1.0.0
├── debug@2.2.0 (ms@0.7.1)
...
...
├── pg-types@1.7.0
├── semver@4.3.6
└── pgpass@0.0.3 (split@0.3.3)
```
2. Run the test suite.
```console
$ make test

> aro@0.0.0 test /vagrant/app
> mocha --recursive



  GeoJsonHelper
    #build_feature_collection()
      ✓ should build a GeoJSON FeatureCollection
      ✓ should build an array of Features
      ✓ should include specified properties in the GeoJSON

  CountySubdivision
    #find_by_statefp()
      ✓ should return a GeoJSON FeatureCollection (943ms)
      ✓ should return more than one Feature (948ms)
      ✓ should have a geometry feature which includes an array of MultiPolygons (953ms)
      ✓ should have an array of MultiPolygons each with multiple coordinates (918ms)

  RoadSegment
    #find_by_countyfp()
      ✓ should return a GeoJSON FeatureCollection (240ms)
      ✓ should return more than one Feature (199ms)
      ✓ should have a geometry feature which includes an array of MultiPolygons (190ms)
      ✓ should have an array of MultiPolygons each with multiple coordinates (199ms)


  11 passing (5s)

```
3. Finally, start the webserver
```console
$ make webserver

```

Now you can access the application by browsing to `http://localhost:8000` from your host machine.

***WALKTHROUGH ENDS HERE***


## Config Updates
1. Update the config submodule:
```console
$ git submodule update
```
If there is no output to that command, then the configuration has not been modified. 

2. If the previous command results in a configuration update, you will need to reprovision your Vagrant virtual machine to keep your environment setup consistent. 
If your machine is already running:
```console
$ vagrant provision
```
If the machine is currently halted:
```console
$ vagrant up --provision
```
