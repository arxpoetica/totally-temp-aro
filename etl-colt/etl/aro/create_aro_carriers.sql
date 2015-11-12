DROP TABLE IF EXISTS aro.carriers;

CREATE TABLE aro.carriers
(
	id serial,
	name varchar,
	route_type varchar,
	CONSTRAINT aro_carriers_pkey PRIMARY KEY (id)
);

INSERT INTO aro.carriers (name, route_type) values('Colt', 'fiber');
INSERT INTO aro.carriers (name, route_type) values('Interroute', 'fiber');
INSERT INTO aro.carriers (name, route_type) values('Level 3', 'fiber');
INSERT INTO aro.carriers (name, route_type) values('Zayo', 'fiber');
INSERT INTO aro.carriers (name, route_type) values('EUNetworks', 'fiber');
INSERT INTO aro.carriers (name, route_type) values('Versatel', 'fiber');
INSERT INTO aro.carriers (name, route_type) values('Bouygues', 'coverage_area');
INSERT INTO aro.carriers (name, route_type) values('Deutsche Telekom', 'ilec');
INSERT INTO aro.carriers (name, route_type) values('Orange', 'ilec');