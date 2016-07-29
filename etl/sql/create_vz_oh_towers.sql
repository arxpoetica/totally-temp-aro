DROP TABLE IF EXISTS vz_towers.vz_oh_towers;

CREATE TABLE vz_towers.vz_oh_towers
(
	status varchar,
	name varchar,
	site_type varchar,
	lat double precision,
	lon double precision,
	structure_type varchar,
	towercompany_landlord varchar,
	hub_site varchar,
	transport_provider varchar,
	transport_type varchar,
	city varchar,
	zip_code varchar
);