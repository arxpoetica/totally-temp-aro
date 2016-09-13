DROP TABLE IF EXISTS businesses.vz_customers;

CREATE TABLE businesses.vz_customers
(
	conc varchar,
	state varchar,
	csalt_lata varchar,
	csalt_address_id varchar,
	srv_code varchar,
	wc_flag varchar,
	sub_ds1 numeric,
	ds1 numeric,
	ds3 numeric,
	oc3 numeric,
	oc12 numeric,
	oc48 numeric,
	oc192 numeric,
	oc768 numeric,
	ocn numeric,
	ethernet numeric,
	blank numeric,
	grand_total numeric,
	pprint_addy varchar,
	prism_source varchar,
	prism_formatted_address varchar,
	prism_rating varchar,
	prism_long double precision,
	prism_lat double precision
);