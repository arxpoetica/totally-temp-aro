DROP TABLE IF EXISTS aro.carriers;

CREATE TABLE aro.carriers
(
	id serial,
	name varchar,
	route_type varchar,
	color varchar,
	CONSTRAINT aro_carriers_pkey PRIMARY KEY (id)
);

INSERT INTO aro.carriers (name, route_type, color) values('186 COMMUNICATIONS', 'fiber', '#fcafae');
INSERT INTO aro.carriers (name, route_type, color) values('ALLIED PROPOSED', 'fiber', '#f2cc10');
INSERT INTO aro.carriers (name, route_type, color) values('AT&T', 'fiber', '#dca1fc');
INSERT INTO aro.carriers (name, route_type, color) values('Axcess Ontario', 'fiber', '#c4f453');
INSERT INTO aro.carriers (name, route_type, color) values('CENTURYLINK', 'fiber', '#f2d193');
INSERT INTO aro.carriers (name, route_type, color) values('CFN SERVICES', 'fiber', '#f9baa4');
INSERT INTO aro.carriers (name, route_type, color) values('COGENT COMMUNICATIONS', 'fiber', '#7c26a0');
INSERT INTO aro.carriers (name, route_type, color) values('CROWN CASTLE', 'fiber', '#ebbaf4');
INSERT INTO aro.carriers (name, route_type, color) values('DANC', 'fiber', '#db2bd5');
INSERT INTO aro.carriers (name, route_type, color) values('EARTHLINK', 'fiber', '#aefcc8');
INSERT INTO aro.carriers (name, route_type, color) values('FIBERTECH NETWORKS', 'fiber', '#142187');
INSERT INTO aro.carriers (name, route_type, color) values('FINGERLAKES', 'fiber', '#f7f9a7');
INSERT INTO aro.carriers (name, route_type, color) values('FIRSTLIGHT', 'fiber', '#2e0384');
INSERT INTO aro.carriers (name, route_type, color) values('GLOBAL CLOUD XCHANGE', 'fiber', '#07149b');
INSERT INTO aro.carriers (name, route_type, color) values('HUDSON FIBER NETWORK', 'fiber', '#b4caf7');
INSERT INTO aro.carriers (name, route_type, color) values('ION', 'fiber', '#071db2');
INSERT INTO aro.carriers (name, route_type, color) values('LEVEL 3', 'fiber', '#d7c6ff');
INSERT INTO aro.carriers (name, route_type, color) values('LIFE', 'fiber', '#1ba05b');
INSERT INTO aro.carriers (name, route_type, color) values('LIGHTOWER', 'fiber', '#fff09b');
INSERT INTO aro.carriers (name, route_type, color) values('LIGHTSPEED FIBER', 'fiber', '#d83c8a');
INSERT INTO aro.carriers (name, route_type, color) values('METCOM NETWORK SERVICES', 'fiber', '#fc58de');
INSERT INTO aro.carriers (name, route_type, color) values('MONROE COUNTY', 'fiber', '#0cf7eb');
INSERT INTO aro.carriers (name, route_type, color) values('NEXG', 'fiber', '#dd5fa2');
INSERT INTO aro.carriers (name, route_type, color) values('NJ TURNPIKE', 'fiber', '#87f2c9');
INSERT INTO aro.carriers (name, route_type, color) values('PANGAEA NETWORKS', 'fiber', '#fc9562');
INSERT INTO aro.carriers (name, route_type, color) values('RAIL AMERICA ROW', 'fiber', '#70e7f4');
INSERT INTO aro.carriers (name, route_type, color) values('SLIC NETWORKS', 'fiber', '#f4a990');
INSERT INTO aro.carriers (name, route_type, color) values('SOUTHERN TIER NETWORK', 'fiber', '#50edcd');
INSERT INTO aro.carriers (name, route_type, color) values('TW TELECOM', 'fiber', '#fcc4dd');
INSERT INTO aro.carriers (name, route_type, color) values('VERIZON', 'fiber', '#adacef');
INSERT INTO aro.carriers (name, route_type, color) values('WINDSTREAM', 'fiber', '#440cd1');
INSERT INTO aro.carriers (name, route_type, color) values('XO COMMUNICATIONS', 'fiber', '#e2cb8e');
INSERT INTO aro.carriers (name, route_type, color) values('ZAYO', 'fiber', '#e896ca');
INSERT INTO aro.carriers (name, route_type, color) values('ZITO', 'fiber', '#7053e2');
