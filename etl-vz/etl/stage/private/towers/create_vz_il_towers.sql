DROP TABLE IF EXISTS towers.vz_il_towers;

CREATE TABLE towers.vz_il_towers
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