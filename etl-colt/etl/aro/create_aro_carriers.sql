DROP TABLE IF EXISTS aro.carriers;

CREATE TABLE aro.carriers
(
	id serial,
	name varchar,
	route_type varchar,
	color varchar,
	CONSTRAINT aro_carriers_pkey PRIMARY KEY (id)
);

INSERT INTO aro.carriers (name, route_type, color) values('Colt', 'fiber', '#00a499');
INSERT INTO aro.carriers (name, route_type, color) values('Interoute', 'fiber', '#89dbf4');
INSERT INTO aro.carriers (name, route_type, color) values('Level 3', 'fiber', '#e58575');
INSERT INTO aro.carriers (name, route_type, color) values('Zayo', 'fiber', '#e899d0');
INSERT INTO aro.carriers (name, route_type, color) values('EUNetworks', 'fiber', '#399310');
INSERT INTO aro.carriers (name, route_type, color) values('Versatel', 'fiber', '#e2df22');
INSERT INTO aro.carriers (name, route_type, color) values('Bouygues', 'coverage_area', '#9eaa14');
INSERT INTO aro.carriers (name, route_type, color) values('Numericable', 'coverage_area', '#67a204');
INSERT INTO aro.carriers (name, route_type, color) values('Deutsche Telekom', 'ilec', '#c330f4');
INSERT INTO aro.carriers (name, route_type, color) values('Orange', 'ilec', '#3b1984');
