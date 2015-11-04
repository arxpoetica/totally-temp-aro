DROP TABLE IF EXISTS source_colt.prospects;

CREATE TABLE source_colt.prospects
(
	id serial,
	company_name varchar,
	company_label varchar,
	address varchar,
	address_2 varchar,
	postcode varchar,
	city varchar,
	sic_4 int,
	sic_2 int,
	sic_industry_german varchar,
	sic_industry_english varchar,
	solon_av_industry varchar,
	employees int,
	employees_bracket varchar,
	lat double precision,
	lon double precision,
	CONSTRAINT pkey_source_colt_prospects_id PRIMARY KEY (id)
);