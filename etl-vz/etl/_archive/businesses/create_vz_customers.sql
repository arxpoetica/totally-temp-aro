DROP TABLE IF EXISTS businesses.vz_customers;

CREATE TABLE businesses.vz_customers
(
	customer_key_location varchar,
	nasp_nm varchar,
	sum_mrc numeric,
	svc_location varchar,
	prism_source varchar,
	prism_formatted_address varchar,
	long double precision,
	lat double precision,
	is_2k boolean
);