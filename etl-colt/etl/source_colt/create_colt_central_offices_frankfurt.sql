DROP TABLE IF EXISTS source_colt.central_offices_frankfurt;

CREATE TABLE source_colt.central_offices_frankfurt
(
	id serial,
	country varchar,
	city varchar,
	dsl_site_id varchar,
	site varchar,
	model varchar,
	type varchar,
	status varchar,
	address varchar,
	city_long varchar,
	plz varchar,
	lat double precision,
	lon double precision,
	CONSTRAINT pkey_source_colt_central_offices_frankfurt_id PRIMARY KEY (id)
);