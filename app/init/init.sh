#!/bin/bash

sudo apt-get update

# Install PostgreSQL
sudo apt-get -y install postgresql postgresql-contrib postgresql-client
sudo apt-get -y install postgresql-client-common

# Create database
USER='aro'
PASSWD='aro'
DBNAME='aro'
sudo su postgres -c "psql -f createdb.sql -v passwd=$PASSWD -v user=$USER -v dbname=$DBNAME"

sudo cp pg_hba.conf /etc/postgresql/9.3/main/pg_hba.conf
sudo service postgresql restart
sudo cp postgresql.conf /etc/postgresql/9.3/main/postgresql.conf

# Add PostGIS extension to database
sudo apt-get install -y postgis postgresql-9.3-postgis-2.1

echo "Creating PostGIS extension..."

sudo -u postgres psql -c "CREATE EXTENSION postgis; CREATE EXTENSION postgis_topology;" $DBNAME

# Install NPM and Node.js
sudo apt-get -y install nodejs
sudo apt-get -y install npm
npm install forever -g
# For some reason, 'nodejs' brings up the node console, but 'node' doesn't unless you symlink it
sudo ln -s /usr/bin/nodejs /usr/sbin/node  

exit
