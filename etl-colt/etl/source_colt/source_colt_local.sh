#!/bin/bash

# MOVE ALL OF THIS BACK TO SOURCE COLT ETL AFTER PUTTING FILES IN 

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from
echo $DIR

$PSQL -f $DIR/create_colt_paris_cos.sql

# TODO: need to move these local files to S3, but I didn't have access to the bucket when I did this.
cat /$DIR/local_data/paris_co_list.csv | ${PSQL} -a -c "COPY source_colt.paris_cos\
    (region,department,city_code,coverage_cities,co_nickname,ft_co_id,address,zip_code,city,full_address,xng_site_name,xng_site_id,lat,lon) \
    FROM STDIN DELIMITER ',' CSV HEADER encoding 'windows-1251';"

$PSQL -f $DIR/create_colt_frankfurt_cos.sql

cat /$DIR/local_data/frankfurt_co_list.csv | ${PSQL} -a -c "COPY source_colt.frankfurt_cos\
    (country,city,dsl_site_id,site,model,type,status,address,city_long,plz,lat,lon) \
    FROM STDIN DELIMITER ',' CSV HEADER encoding 'windows-1251';"

