DROP TABLE IF EXISTS network_equipment.hubs_csv;

CREATE TABLE network_equipment.hubs_csv
(
	site varchar,
	address varchar,
	city varchar,
	state varchar,
	lat double precision,
	long double precision,
	cran_cluster varchar,
	cran_hub varchar,
	msc varchar,
	site_category varchar,
	location varchar
);

