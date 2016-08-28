DROP TABLE IF EXISTS businesses.tam;

CREATE TABLE businesses.tam
(
	duns_number varchar,
	guduns varchar,
	total_tam_2015 numeric,
	emp_tot int,
	emp_here int,
	business_nm varchar,
	secondary_nm varchar,
	street_addr varchar,
	city varchar,
	state_abbrev varchar,
	zip_cd varchar,
	zip_plus_4 varchar,
	original_latitude double precision,
	original_longitude double precision,
	arcgis_longitude double precision,
	arcgis_latitude double precision
);