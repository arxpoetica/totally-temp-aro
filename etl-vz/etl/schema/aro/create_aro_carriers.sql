DROP TABLE IF EXISTS aro.carriers;

CREATE TABLE aro.carriers
(
	id serial,
	name varchar,
	route_type varchar,
	color varchar,
	CONSTRAINT aro_carriers_pkey PRIMARY KEY (id)
);

