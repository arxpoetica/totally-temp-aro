#!/bin/bash

# 1. Load the raw data from TIGER COUSUB into the schema.
# 2. Reduce the raw TIGER COUSUB data into aro_cousub table format.
#
# GENERAL ASSUMPTIONS/HACKS: DON'T HARDCODE ALL OF THIS STUFF.
# For now, we're just downloading one county for the base development environment.

export PGDATABASE=aro

# We should download these to an S3 bucket when we load the rest of the country.
sudo mkdir shapefiles
sudo mkdir shapefiles/tl_2014_53_cousub

sudo wget -P shapefiles/tl_2014_53_cousub/ "ftp://ftp2.census.gov/geo/tiger/TIGER2014/COUSUB/tl_2014_53_cousub.zip"
unzip shapefiles/tl_2014_53_cousub/tl_2014_53_cousub.zip -d shapefiles/tl_2014_53_cousub/
sudo rm shapefiles/tl_2014_53_cousub/tl_2014_53_cousub.zip

# Create & load the table for the raw TIGER COUSUB data
sudo su postgres -c "shp2pgsql -I -s 26918 shapefiles/tl_2014_53_cousub/tl_2014_53_cousub.shp public.tiger_cousub | psql -U postgres -d ${PGDATABASE}"

# Reduce the number of columns in tiger_cousub to only those relevant to the app and store result in aro_cousub
sudo su postgres -c "psql -d ${PGDATABASE} -a -f create_aro_cousub.sql"

exit