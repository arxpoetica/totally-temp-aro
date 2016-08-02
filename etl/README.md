# Restructured ETL Process

The ETL process has been restructured and streamlined to require fewer files, fewer downloads, and hopefully fewer mistakes.

All source data is preloaded on staging/production instances via the `aro/app-data` docker container which should be mounted at `/opt/aro-app-data`.

For local and development access to these source files, the `aro-app-data` repository should be cloned to a local path which is then saved in the `ARO_DATA_ROOT` environment variable. If this variable does not exist, it is assumed to live at `/opt/aro-app-data`. 

*Important*: Github LFS is **required** for cloning the `aro-app-data` repository. Instructions on cloning/setup and working with that repository in its `README` (todo: actually add this)

### Current process
Loading data into a clean database (or reloading into an existing database) can be accomplished as follows:
1.  If working in a local/dev environment: `source ./initialize.sh`
2.  `make etl_reload_all`

Running limited subsets of ETL processes requires running the appropriate script directly. More `Makefile` commands to follow.

###Todos
 - `Makefile` with more granular commands
 - Better instructions
 - `README` and instructions for `aro-app-data` repository, including how to add new data sources
 - Add state codes as variables in the Makefile which are then passed to the subscripts as appropriate to reduce duplication