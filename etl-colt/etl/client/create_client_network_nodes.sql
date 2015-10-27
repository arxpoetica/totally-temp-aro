DROP TABLE IF EXISTS client.network_nodes;

CREATE TABLE client.network_nodes
(
	id serial,
	lat double precision,
	lon double precision,
	node_type_id int references client.network_node_types,
	geog geography('POINT', 4326),
	CONSTRAINT network_nodes_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('client', 'network_nodes', 'geom', 4326, 'POINT', 2);

-- COs must be added from two different Colt source tables: source_colt.paris_cos and source_colt.frankfurt_cos
-- The original data formats were quite different, and to preserve the format, two tables were created.

-- Load Paris COs
INSERT INTO client.network_nodes(lat, lon, node_type_id, geog, geom)
	SELECT 
		lat,
		lon,
		(select t.id from client.network_node_types t where name = 'central_office' limit 1)::int,
		ST_SetSRID(ST_Point(lon, lat),4326)::geography as geog,
		ST_SetSRID(ST_Point(lon, lat),4326) as geom
	FROM
		source_colt.paris_cos;

-- Load Frankfurt COs
INSERT INTO client.network_nodes(lat, lon, node_type_id, geog, geom)
	SELECT
		lat,
		lon,
		(select t.id from client.network_node_types t where name = 'central_office' limit 1)::int,
		ST_SetSRID(ST_Point(lon, lat),4326)::geography as geog,
		ST_SetSRID(ST_Point(lon, lat),4326) as geom
	FROM
		source_colt.frankfurt_cos;

CREATE INDEX client_network_nodes_geom_gist ON client.network_nodes USING gist (geom);
CREATE INDEX client_network_nodes_geog_gist ON client.network_nodes USING gist (geog);