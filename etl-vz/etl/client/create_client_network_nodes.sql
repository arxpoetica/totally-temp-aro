DROP TABLE IF EXISTS client.network_nodes;

CREATE TABLE client.network_nodes
(
	id bigserial,
	plan_id bigint REFERENCES client.plan ON DELETE CASCADE,
	lat double precision,
	lon double precision,
	node_type_id int references client.network_node_types,
	geog geography('POINT', 4326),

	household_count double precision default 0,
	business_count double precision default 0,
	celltower_count double precision default 0,
	atomic_count double precision default 0,

	CONSTRAINT network_nodes_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('client', 'network_nodes', 'geom', 4326, 'POINT', 2);


-- Use the CRAN Hubs as COs
INSERT INTO client.network_nodes (node_type_id, geog, geom)
	SELECT
		(select t.id from client.network_node_types t where name = 'central_office' limit 1)::int, 
		geog,
		geom
	FROM
		network_equipment.hubs;

-- Round the CO coordinates so that they are near, but not on, the centroid
--update client.network_nodes set geog = st_setsrid(st_makepoint(round(st_x(geog::geometry)::numeric, 2), round(st_y(geog::geometry)::numeric, 2)), st_srid(geog)) where plan_id is null and node_type_id = 1;
--update client.network_nodes set geom = st_setsrid(st_makepoint(round(st_x(geom::geometry)::numeric, 2), round(st_y(geom::geometry)::numeric, 2)), st_srid(geom)) where plan_id is null and node_type_id = 1;

CREATE INDEX client_network_nodes_geom_gist ON client.network_nodes USING gist (geom);
CREATE INDEX client_network_nodes_geog_gist ON client.network_nodes USING gist (geog);
CREATE INDEX client_network_nodes_route_index ON client.network_nodes(plan_id);
