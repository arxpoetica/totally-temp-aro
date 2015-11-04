#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
SHP2PGSQL=${PGBIN}/shp2pgsql
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Get geotel source file from S3
# TODO: obviously this needs to be dynamic and not hard-coded for a specific file

cd $GISROOT;
rm -rf ${TMPDIR}/*

# Retrieve files from S3 and uncompress to working directory
aws s3 cp --region us-east-1 s3://colt.aro/colt_fiber.zip ./
aws s3 cp --region us-east-1 s3://colt.aro/colt_locations.zip ./
for z in colt*.zip ; do $UNZIPTOOL -o -d $TMPDIR $z; done
cd $TMPDIR;

# Create and load source_colt schema 
$PSQL -a -c "DROP SCHEMA IF EXISTS source_colt CASCADE;"
$PSQL -a -c "CREATE SCHEMA source_colt;"

# Convert and load fiber route data
ogr2ogr -f "ESRI Shapefile" ./paris_fiber paris_fiber.kml -overwrite
ogr2ogr -f "ESRI Shapefile" ./frankfurt_fiber frankfurt_fiber.kml -overwrite

${SHP2PGSQL} -c -s 4326 './paris_fiber/Trench_active (d).dbf' source_colt.paris_fiber | ${PSQL}
${SHP2PGSQL} -c -s 4326 './frankfurt_fiber/Trench_active (d).dbf' source_colt.frankfurt_fiber | ${PSQL}

# Create and load table for location data
# We may not use this, but for now we're preserving it as part of the client's raw data set.
$PSQL -f $DIR/create_colt_locations.sql
cat /$TMPDIR/colt_locations.csv | ${PSQL} -a -c "COPY source_colt.locations\
    (bm_access_type,bm_building_category,bm_building_id,bm_building_status,bm_building_type,bm_carrier_hotels,bm_cmnt_schema,bm_comments,bm_complex_building_id,bm_complex_building_name,bm_create_date,bm_dual_entry,bm_internal_building_id,bm_in_house_cabling,bm_name_of_carrier_hotel,bm_updated_date,ad_address_id,ad_building_id,ad_building_name,ad_cityname_english,ad_cityname_local,ad_cnmt_building_id,ad_cnmt_street_id,ad_cnmt_street_name,ad_cnmt_x_coordinates,ad_cnmt_y_coordinates,ad_country_code,ad_country_id,ad_country_name,ad_created_date,ad_cc_address,ad_house_number,ad_is_complex,ad_latitude,ad_longitude,ad_postal_code,ad_pricing_id,ad_province,ad_primary_address,ad_residue,ad_source,ad_street_name,ad_street_name_local,ad_updated_date,sd_validated,sd_access_type,sd_address_id,sd_building_id,sd_created_date,sd_customer_name,sd_floor,sd_internal_site_id,sd_ocn,sd_pm_man_city_code,sd_room,sd_sitetype,sd_site_id,sd_site_name,sd_status,sd_updated_date,sd_xng_id,ocn_building_id,s_check) \
    FROM STDIN DELIMITER ',' CSV HEADER encoding 'windows-1251';"

# Create businesses (existing customers and prospective customers) from several tables:

# 1. Create and load customers table
$PSQL -f $DIR/create_colt_customers.sql
# Load Frankfurt customers
cat /$DIR/local_data/colt_customers_frankfurt_v3.csv | ${PSQL} -a -c "COPY source_colt.customers\
    (building_id,s_ocn,cust_name,man_employee_total,db_country_name,db_nace_code,db_employee_here,db_employee_total,db_sic_code,db_industry,db_industry_level_1,db_industry_level_2,db_industry_level_3,gl_revenue_year_2014,db_duns,sfdc_account_name,carrier_voice,colocation,colt_total,customer_asset_sales_data,customer_asset_sales_managed_services,data_centre_services,data_centre_services_installation_adjustment,data_installation_adjustment,dedicated_hosting,ethernet_point_to_point,ethernet_vpn,high_speed_service,incoming,in_services,intercompany_voice,internet_access,ip_voice,ipvpn_corporate,link,managed_service_installation_adjustment,other_bandwidth,other_misc_data,other_voice,professional_services,reseller_voice,shared_hosting,voice_connect,voice_line,others,channel) \
    FROM STDIN DELIMITER ',' CSV HEADER encoding 'windows-1251';"
# Load Paris customers
cat /$DIR/local_data/colt_customers_paris_v3.csv | ${PSQL} -a -c "COPY source_colt.customers\
    (building_id,s_ocn,cust_name,man_employee_total,db_country_name,db_nace_code,db_employee_here,db_employee_total,db_sic_code,db_industry,db_industry_level_1,db_industry_level_2,db_industry_level_3,gl_revenue_year_2014,db_duns,sfdc_account_name,carrier_voice,colocation,colt_total,customer_asset_sales_data,customer_asset_sales_managed_services,data_centre_services,data_centre_services_installation_adjustment,data_installation_adjustment,dedicated_hosting,ethernet_point_to_point,ethernet_vpn,high_speed_service,incoming,in_services,intercompany_voice,internet_access,ip_voice,ipvpn_corporate,link,managed_service_installation_adjustment,other_bandwidth,other_misc_data,other_voice,professional_services,reseller_voice,shared_hosting,voice_connect,voice_line,others,channel) \
    FROM STDIN DELIMITER ',' CSV HEADER encoding 'windows-1251';"

# 2. Create prospective customers table
$PSQL -f $DIR/create_colt_prospects.sql

# Load prospect data from Paris and Frankfurt
cat /$DIR/local_data/colt_prospects_frankfurt.csv | ${PSQL} -a -c "COPY source_colt.prospects\
    (company_name,company_label,address,address_2,postcode,city,sic_4,sic_2,sic_industry_german,sic_industry_english,solon_av_industry,employees,employees_bracket,lat,lon) \
    FROM STDIN DELIMITER ',' CSV HEADER encoding 'windows-1251';"

cat /$DIR/local_data/colt_prospects_paris.csv | ${PSQL} -a -c "COPY source_colt.prospects\
    (company_name,company_label,address,address_2,postcode,city,sic_4,sic_2,sic_industry_german,sic_industry_english,solon_av_industry,employees,employees_bracket,lat,lon) \
    FROM STDIN DELIMITER ',' CSV HEADER encoding 'windows-1251';"

# 3. Create and load the CO data from Paris and Frankfurt. Paris and Frankfurt data came in two separate formats, so we made 2 tables.

$PSQL -f $DIR/create_colt_central_offices_paris.sql
# TODO: need to move these local files to S3, but I didn't have access to the bucket when I did this.
cat /$DIR/local_data/colt_central_offices_paris.csv | ${PSQL} -a -c "COPY source_colt.central_offices_paris\
    (region,department,city_code,coverage_cities,co_nickname,ft_co_id,address,zip_code,city,full_address,xng_site_name,xng_site_id,lat,lon) \
    FROM STDIN DELIMITER ',' CSV HEADER encoding 'windows-1251';"

$PSQL -f $DIR/create_colt_central_offices_frankfurt.sql

cat /$DIR/local_data/colt_central_offices_frankfurt.csv | ${PSQL} -a -c "COPY source_colt.central_offices_frankfurt\
    (country,city,dsl_site_id,site,model,type,status,address,city_long,plz,lat,lon) \
    FROM STDIN DELIMITER ',' CSV HEADER encoding 'windows-1251';"