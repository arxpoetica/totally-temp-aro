-- Table: source_colt.locations

DROP TABLE IF EXISTS source_colt.locations;

CREATE TABLE source_colt.locations
(
  id serial,
  bm_access_type VARCHAR,
  bm_building_category VARCHAR,
  bm_building_id VARCHAR,
  bm_building_status VARCHAR,
  bm_building_type VARCHAR,
  bm_carrier_hotels VARCHAR,
  bm_cmnt_schema VARCHAR,
  bm_comments VARCHAR,
  bm_complex_building_id VARCHAR,
  bm_complex_building_name VARCHAR,
  bm_create_date VARCHAR,
  bm_dual_entry VARCHAR,
  bm_internal_building_id VARCHAR,
  bm_in_house_cabling VARCHAR,
  bm_name_of_carrier_hotel VARCHAR,
  bm_updated_date VARCHAR,
  ad_address_id VARCHAR,
  ad_building_id VARCHAR,
  ad_building_name VARCHAR,
  ad_cityname_english VARCHAR,
  ad_cityname_local VARCHAR,
  ad_cnmt_building_id VARCHAR,
  ad_cnmt_street_id VARCHAR,
  ad_cnmt_street_name VARCHAR,
  ad_cnmt_x_coordinates VARCHAR,
  ad_cnmt_y_coordinates VARCHAR,
  ad_country_code VARCHAR,
  ad_country_id VARCHAR,
  ad_country_name VARCHAR,
  ad_created_date VARCHAR,
  ad_cc_address VARCHAR,
  ad_house_number VARCHAR,
  ad_is_complex VARCHAR,
  ad_latitude DOUBLE PRECISION,
  ad_longitude DOUBLE PRECISION,
  ad_postal_code VARCHAR,
  ad_pricing_id VARCHAR,
  ad_province VARCHAR,
  ad_primary_address VARCHAR,
  ad_residue VARCHAR,
  ad_source VARCHAR,
  ad_street_name VARCHAR,
  ad_street_name_local VARCHAR,
  ad_updated_date VARCHAR,
  sd_validated VARCHAR,
  sd_access_type VARCHAR,
  sd_address_id VARCHAR,
  sd_building_id VARCHAR,
  sd_created_date VARCHAR,
  sd_customer_name VARCHAR,
  sd_floor VARCHAR,
  sd_internal_site_id VARCHAR,
  sd_ocn VARCHAR,
  sd_pm_man_city_code VARCHAR,
  sd_room VARCHAR,
  sd_sitetype VARCHAR,
  sd_site_id VARCHAR,
  sd_site_name VARCHAR,
  sd_status VARCHAR,
  sd_updated_date VARCHAR,
  sd_xng_id VARCHAR,
  ocn_building_id VARCHAR,
  s_check VARCHAR,

  CONSTRAINT pkey_source_colt_locations_id PRIMARY KEY (id)
);
    
