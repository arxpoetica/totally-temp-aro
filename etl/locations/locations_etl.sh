#!/bin/bash

# Loads Locations, Businesses, and Industries by mining InfoUSA raw data source
#
# 1. Creates and loads infousa_businesses table, which stores raw input in InfoUSA's typical format.
# 2. Reduces infousa_businesses by distinct lat/lon pairs to create and load the aro_locations table 
# 3. Reduces infousa_businesses by distinct sic4 code to create and load the aro_industries table
# 4. Mines the infousa_businesses table to create the aro_businesses table, now mapped to aro_locations table by location_id 

export PGDATABASE=aro

# 1. Create and load infousa_businesses table
sudo su postgres -c "psql -d ${PGDATABASE} -a -f create_infousa_businesses.sql"
sudo su postgres -c "psql -d ${PGDATABASE} -a -f load_infousa_businesses.sql"

# 2. Create aro_locations table from infousa_businesses table
sudo su postgres -c "psql -d ${PGDATABASE} -a -f create_aro_locations.sql"

# 3. Create aro_industries table from infousa_businesses table
sudo su postgres -c "psql -d ${PGDATABASE} -a -f create_aro_industries.sql"

# 4. Create aro_businesses table from infousa_businesses table
sudo su postgres -c "psql -d ${PGDATABASE} -a -f create_aro_businesses.sql"
