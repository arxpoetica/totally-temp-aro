DROP TABLE IF EXISTS network_equipment.hubs_csv;

CREATE TABLE network_equipment.hubs_csv
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

