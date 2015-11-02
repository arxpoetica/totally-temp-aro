DROP TABLE IF EXISTS aro.carriers;

CREATE TABLE aro.carriers
(
	id serial,
	name varchar,
	carrier_route_type varchar,
	CONSTRAINT aro_carriers_pkey PRIMARY KEY (id)
);

INSERT INTO aro.carriers (name, carrier_route_type) values('Colt', 'fiber');
INSERT INTO aro.carriers (name, carrier_route_type) values('Interroute', 'fiber');
INSERT INTO aro.carriers (name, carrier_route_type) values('Level 3', 'fiber');
INSERT INTO aro.carriers (name, carrier_route_type) values('Desutsche Telekom', 'ilec');