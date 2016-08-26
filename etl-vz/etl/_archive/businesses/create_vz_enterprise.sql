DROP TABLE IF EXISTS businesses.vz_enterprise;

CREATE TABLE businesses.vz_enterprise
(
	customer_key_location varchar,
	nasp_nm varchar,
	sum_mrc numeric,
	svc_location varchar,
	prism_source varchar,
	prism_formatted_address varchar,
	prism_long double precision,
	prism_lat double precision
);