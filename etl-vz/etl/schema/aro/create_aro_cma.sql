DROP TABLE IF EXISTS aro.cma;

CREATE TABLE aro.cma
(
	id serial,
	gid int,
	name varchar,
	geog geography('MULTIPOLYGON', 4326),
	CONSTRAINT aro_cma_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('aro', 'cma', 'geom', 4326, 'MULTIPOLYGON', 2);
SELECT AddGeometryColumn('aro', 'cma', 'edge_buffer', 4326, 'GEOMETRY', 2);
SELECT AddGeometryColumn('aro', 'cma', 'location_edge_buffer', 4326, 'GEOMETRY', 2);

CREATE INDEX aro_cma_geom_gist ON aro.cma USING gist (geom);
CREATE INDEX aro_cma_geog_gist ON aro.cma USING gist (geog);
CREATE INDEX aro_cma_edge_buffer ON aro.cma USING gist (edge_buffer);
CREATE INDEX aro_cma_location_edge_buffer ON aro.cma USING gist (location_edge_buffer);

-- INSERT INTO aro.cma(gid, name, geog, geom, edge_buffer, location_edge_buffer)
-- 	SELECT
-- 		gid,
-- 		name,
-- 		Geography(ST_Force_2D(the_geom)) as geog,
-- 		ST_Force_2D(the_geom) AS geom,
-- 		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 200)::Geometry, 4326),
-- 		ST_Transform(ST_buffer(ST_Convexhull(the_geom)::Geography, 50)::Geometry, 4326) 
-- 	FROM boundaries.cma;