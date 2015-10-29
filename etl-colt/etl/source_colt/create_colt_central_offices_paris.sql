DROP TABLE IF EXISTS source_colt.central_offices_paris;

CREATE TABLE source_colt.central_offices_paris
(
	id serial,
	region varchar,
	department varchar,
	city_code varchar,
	coverage_cities varchar,
	co_nickname varchar,
	ft_co_id varchar,
	address varchar,
	zip_code varchar,
	city varchar,
	full_address varchar,
	xng_site_name varchar,
	xng_site_id varchar,
	lat double precision,
	lon double precision,
	CONSTRAINT pkey_source_colt_central_offices_paris_id PRIMARY KEY (id)
);