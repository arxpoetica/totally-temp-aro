DROP TABLE IF EXISTS network_equipment.directional_facilities;

CREATE TABLE network_equipment.directional_facilities
(
	smm_business_unit varchar,
	util_key_2012 varchar,
	master_site_code varchar,
	real_estate_glc_code varchar,
	site_type varchar,
	service_type varchar,
	market_grouping varchar,
	latitude double precision,
	longitude double precision,
	unique_record_count_city varchar,
	unique_record_count_building varchar,
	unique_vzt_owned_leased_building varchar,
	type_building_level varchar,
	tiered_city varchar,
	updated_tier varchar,
	country varchar,
	city varchar,
	state varchar,
	address_1 varchar,
	address_2 varchar,
	ilec varchar,
	owned_leased varchar
);