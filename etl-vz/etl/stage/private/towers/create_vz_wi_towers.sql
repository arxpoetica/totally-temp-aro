DROP TABLE IF EXISTS towers.vz_wi_towers;

CREATE TABLE towers.vz_wi_towers (
	site_name varchar,
	address varchar,
	state varchar,
	cran_cluster varchar,
	cran_hub varchar,
	msc varchar,
	site_category varchar,
	long double precision,
	lat double precision
);