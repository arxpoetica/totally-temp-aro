DROP TABLE IF EXISTS ref_towers.sita_towers;

CREATE TABLE ref_towers.sita_towers
(
	sita_number varchar,
	latitude double precision,
	longitude double precision,
	parcel_address varchar,
	parcel_city varchar,
	parcel_state varchar,
	support_structure_owner varchar,
	site_id varchar,
	site_name varchar,
	fcc_registration_number int,
	structure_height int,
	ground_elevation int,
	structure_agl int,
	structure_amsl int,
	structure_type varchar,
	tower_type varchar,
	record_type varchar,
	location_accuracy varchar,
	fcc_entity_name varchar,
	previous_owner varchar,
	_2nd_previous_owner varchar,
	_3rd_previous_owner varchar,
	_4th_previous_owner varchar,
	_5th_previous_owner varchar,
	_6th_previous_owner varchar,
	_7th_previous_owner varchar,
	_1st_faa_applicant varchar,
	_2nd_faa_applicant varchar,
	_3rd_faa_applicant varchar,
	_4th_faa_applicant varchar,
	_5th_faa_applicant varchar,
	extra_faa_applicant_data varchar,
	exist_proposed varchar,
	CONSTRAINT pk_sita_towers PRIMARY KEY (sita_number)
);