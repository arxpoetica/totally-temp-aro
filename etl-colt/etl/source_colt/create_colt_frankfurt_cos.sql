DROP TABLE IF EXISTS source_colt.frankfurt_cos;

CREATE TABLE source_colt.frankfurt_cos
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
	CONSTRAINT pkey_source_colt_frankfurt_cos_id PRIMARY KEY (id)
);