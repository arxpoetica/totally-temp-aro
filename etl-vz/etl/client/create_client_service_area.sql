DROP TABLE IF EXISTS client.service_area;

CREATE TABLE client.service_area
(
	id serial,
	service_type varchar(1),
	service_layer_id int4 not null references client.service_area, 
	source_id varchar(64),
	state varchar(6),
	code varchar(64),
	geog geography('MULTIPOLYGON', 4326),
	CONSTRAINT client_service_area_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('client', 'service_area', 'geom', 4326, 'MULTIPOLYGON', 2);
SELECT AddGeometryColumn('client', 'service_area', 'edge_buffer', 4326, 'GEOMETRY', 2);
SELECT AddGeometryColumn('client', 'service_area', 'location_edge_buffer', 4326, 'GEOMETRY', 2);


CREATE INDEX client_service_area_geom_gist ON client.service_area USING gist (geom);
CREATE INDEX client_service_area_geog_gist ON client.service_area USING gist (geog);
CREATE INDEX client_service_area_edge_buffer ON client.service_area USING gist (edge_buffer);
CREATE INDEX client_service_area_location_edge_buffer ON client.service_area USING gist (location_edge_buffer);


-- Load Geotel wirecenters (public)
WITH wirecenter_layer AS (
	SELECT * FROM client.service_layer WHERE name = 'wirecenter'
) 
INSERT INTO client.service_area (service_layer_id, service_type, source_id, state, code, geog, geom, edge_buffer, location_edge_buffer)
	SELECT
		l.id,
		'A',
		w.gid::varchar,
		state,
		wirecenter,
		Geography(ST_Force_2D(the_geom)) as geog, -- Use ST_FORce_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_Force_2D(the_geom) AS geom, -- Use ST_FORce_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 200)::Geometry, 4326),
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 50)::Geometry, 4326)  
	FROM geotel.wirecenters w, wirecenter_layer l;

-- Load FCC CMA boundaries (public)
WITH cma_layer AS (
	SELECT * FROM client.service_layer WHERE name = 'cma'
)
INSERT INTO client.service_area (service_layer_id, service_type, source_id, code, geog, geom, edge_buffer, location_edge_buffer)
	SELECT
		l.id,
		'A',
		c.gid::varchar,
		c.name,
		Geography(ST_Force_2D(the_geom)) as geog,
		ST_Force_2D(the_geom) AS geom, -- Use ST_FORce_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 200)::Geometry, 4326),
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 50)::Geometry, 4326)  
	FROM boundaries.cma c, cma_layer l;


-- Load client-defined CRAN boundaries (PRIVATE - client data)
WITH cran_layer AS (
	SELECT * FROM client.service_layer WHERE name = 'cran'
)
INSERT INTO client.service_area (service_layer_id, service_type, source_id, code, geog, geom, edge_buffer, location_edge_buffer)
	SELECT
		l.id,
		'A',
		c.gid::varchar,
		c.name,
		Geography(ST_Force_2D(the_geom)) as geog,
		ST_Force_2D(the_geom) AS geom,
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 200)::Geometry, 4326),
		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 50)::Geometry, 4326)
	FROM boundaries.cran c, cran_layer l; 