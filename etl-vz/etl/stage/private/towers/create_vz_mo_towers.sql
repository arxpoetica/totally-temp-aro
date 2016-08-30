DROP TABLE IF EXISTS towers.vz_mo_towers;

CREATE TABLE towers.vz_mo_towers
(
	site varchar,
	cell_type varchar,
	cran_cluster varchar,
	column1 varchar,
	clli varchar,
	type varchar,
	street varchar,
	city varchar,
	state varchar,
	zip varchar,
	zip2 varchar,
	county varchar,
	country varchar,
	lat double precision,
	long double precision
);