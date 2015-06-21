#!/bin/bash

export PGUSER=aro
export PGPASSWORD=aro
export PGDATABASE=aro

sudo apt-get update

# General good stuff
sudo apt-get install unzip

# Install PostgreSQL
sudo apt-get -y install postgresql postgresql-contrib postgresql-client
sudo apt-get -y install postgresql-client-common

# Create database
sudo su postgres -c "psql -f createdb.sql -v passwd=${PGPASSWORD} -v user=${PGUSER} -v dbname=${PGDATABASE}"

sudo cp pg_hba.conf /etc/postgresql/9.3/main/pg_hba.conf
sudo service postgresql restart
sudo cp postgresql.conf /etc/postgresql/9.3/main/postgresql.conf

# Add PostGIS extension to database
sudo apt-get install -y postgis postgresql-9.3-postgis-2.1

echo "Creating PostGIS extension..."

sudo -u postgres psql -c "CREATE EXTENSION postgis; CREATE EXTENSION postgis_topology;" ${PGDATABASE}

# Install pgRouting and add extension to database
sudo apt-add-repository -y ppa:ubuntugis/ppa
sudo apt-add-repository -y ppa:georepublic/pgrouting
sudo apt-get update
sudo apt-get install -y postgresql-9.3-pgrouting

sudo -u postgres psql -c "CREATE EXTENSION pgrouting;" ${PGDATABASE}

# HACK for local environment only. This is irrelevant when we move to OpsWorks environment
sudo -u postgres psql -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${PGUSER}" ${PGDATABASE}
sudo -u postgres psql -c "ALTER DEFAULT PRIVILEGES IN SCHEMA topology GRANT ALL ON TABLES TO ${PGUSER}" ${PGDATABASE}

# Install Node.js and NPM
sudo apt-get -y install nodejs
sudo apt-get -y install npm
# forever need to be installed at the global level and not as part of the app's package.json
sudo npm install forever -g
sudo npm install mocha -g
sudo ln -s /usr/bin/nodejs /usr/sbin/node  

exit
