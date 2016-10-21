DROP TABLE IF EXISTS network_equipment.conduit;

CREATE TABLE network_equipment.conduit
(
	id serial,
	CONSTRAINT network_equipment_conduit_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('network_equipment', 'conduit', 'geom', 4326, 'MULTILINESTRING', 2);

INSERT INTO network_equipment.conduit(geom)
	SELECT
		the_geom
	FROM network_equipment.vzb_conduit_1;

INSERT INTO network_equipment.conduit(geom)
	SELECT
		the_geom
	FROM network_equipment.vzb_conduit_2;

INSERT INTO network_equipment.conduit(geom)
	SELECT
		the_geom
	FROM network_equipment.vzb_conduit_3;