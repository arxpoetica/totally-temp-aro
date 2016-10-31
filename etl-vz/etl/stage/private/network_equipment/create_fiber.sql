DROP TABLE IF EXISTS network_equipment.fiber;

CREATE TABLE network_equipment.fiber
(
	id serial,
	source varchar,
	is_partner_carrier boolean,
	CONSTRAINT network_equipment_fiber_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('network_equipment', 'fiber', 'geom', 4326, 'MULTILINESTRING', 2);

INSERT INTO network_equipment.fiber(source, is_partner_carrier, geom)
	SELECT
		'vzb_fiber',
		false,
		the_geom
	FROM network_equipment.vzb_fiber_part1;

INSERT INTO network_equipment.fiber(source, is_partner_carrier, geom)
	SELECT
		'vzb_fiber',
		false,
		the_geom
	FROM network_equipment.vzb_fiber_part2;