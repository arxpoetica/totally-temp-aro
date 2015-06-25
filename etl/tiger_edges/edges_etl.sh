#!/bin/bash

# 1. Load the raw data from TIGER EDGES into the schema.
# 2. Reduce the raw TIGER EDGES data into aro_edges table format.
# 3. Build aro_graph table using pgRouting
#
# GENERAL ASSUMPTIONS/HACKS: DON'T HARDCODE ALL OF THIS STUFF.
# For now, we're just downloading one county's worth of edges for the base development environment.

export PGDATABASE=aro

# We should download these to an S3 bucket when we load the rest of the country.
sudo mkdir shapefiles
sudo mkdir shapefiles/tl_2014_53033_edges

sudo wget -P shapefiles/tl_2014_53033_edges/ "ftp://ftp2.census.gov/geo/tiger/TIGER2014/EDGES/tl_2014_53033_edges.zip"
unzip shapefiles/tl_2014_53033_edges/tl_2014_53033_edges.zip -d shapefiles/tl_2014_53033_edges/
sudo rm shapefiles/tl_2014_53033_edges/tl_2014_53033_edges.zip

# Create & load the table for the raw TIGER EDGES data
sudo su postgres -c "shp2pgsql -I -s 4326 shapefiles/tl_2014_53033_edges/tl_2014_53033_edges.shp public.tiger_edges | psql -U postgres -d ${PGDATABASE}"

exit