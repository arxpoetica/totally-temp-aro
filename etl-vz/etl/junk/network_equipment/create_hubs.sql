DROP TABLE IF EXISTS network_equipment.hubs;

CREATE TABLE network_equipment.hubs
(
	id serial,
	name varchar,
	geog geography(POINT, 4326),
	CONSTRAINT network_equipment_hubs_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('network_equipment', 'hubs', 'geom', 4326, 'POINT', 2);

-- Insert the SHP hubs
INSERT INTO network_equipment.hubs(name, geog, geom)
	SELECT
		name,
		the_geom::geography,
		the_geom
	FROM network_equipment.hubs_shp;

-- Insert the CSV hubs
INSERT INTO network_equipment.hubs(name, geog, geom)
	SELECT
		site,
		ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography AS geog,
		ST_SetSRID(ST_MakePoint(long, lat), 4326) AS geom
	FROM network_equipment.hubs_csv;
