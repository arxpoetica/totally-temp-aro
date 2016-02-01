DROP TABLE IF EXISTS source_colt.verizon_buildings;

CREATE TABLE source_colt.verizon_buildings
(
	id serial,
	provider varchar,
	postcode varchar,
	city varchar,
	address varchar,
	verizon_nodename varchar,
	lat double precision,
	lon double precision,
	CONSTRAINT pkey_source_colt_verizon_buildings_id PRIMARY KEY (id)
);