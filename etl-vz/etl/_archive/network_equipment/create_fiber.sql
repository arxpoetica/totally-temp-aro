DROP TABLE IF EXISTS network_equipment.fiber;

CREATE TABLE network_equipment.fiber
(
	id serial,
	CONSTRAINT network_equipment_fiber_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('network_equipment', 'fiber', 'geom', 4326, 'MULTILINESTRING', 2);

-- Merge in SHP fiber
INSERT INTO network_equipment.fiber(geom)
	SELECT
		the_geom
	FROM network_equipment.shp_ves_fiber;

-- Merge in KML fiber
INSERT INTO network_equipment.fiber(geom)
	SELECT
		the_geom
	FROM network_equipment.kml_ves_fiber;